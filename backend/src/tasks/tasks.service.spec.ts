import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MqttService } from '../mqtt/mqtt.service.js';
import { TaskStatus } from '../generated/prisma/enums.js';

function createMemoryCache(): Cache {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown, _ttl?: number) => {
      store.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    reset: vi.fn(async () => store.clear()),
    wrap: vi.fn(),
  } as unknown as Cache;
}

describe('TasksService', () => {
  let service: TasksService;
  let cache: Cache;
  let mqttNotify: ReturnType<typeof vi.fn>;

  const taskRow = (overrides: Partial<object> = {}) => ({
    id: 1,
    title: 'Tarefa',
    description: null,
    status: TaskStatus.TODO,
    dueDate: null,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const prismaMock = {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  };

  beforeEach(async () => {
    cache = createMemoryCache();
    mqttNotify = vi.fn();

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MqttService, useValue: { notify: mqttNotify } },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns cached results without querying the database', async () => {
      const cachedResponse = {
        items: [taskRow()],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      const key = 'tasks:list:1:::::1:20';
      await cache.set(key, cachedResponse);

      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      const result = await service.findAll(1, {});

      expect(result).toEqual(cachedResponse);
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it('queries the database and caches the result on a cache miss', async () => {
      prismaMock.task.findMany.mockResolvedValue([taskRow()]);
      prismaMock.task.count.mockResolvedValue(1);

      await service.findAll(1, {});
      // second call must hit cache
      await service.findAll(1, {});

      expect(prismaMock.task.findMany).toHaveBeenCalledTimes(1);
      const cached = await cache.get('tasks:list:1:::::1:20');
      expect(cached).toMatchObject({ total: 1 });
    });

    it('passes status, date and search filters to Prisma', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      await service.findAll(1, {
        status: TaskStatus.DONE,
        dueDateFrom: '2026-01-01',
        dueDateTo: '2026-12-31',
        search: 'teste',
      });

      const findManyCall = prismaMock.task.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({
        userId: 1,
        status: TaskStatus.DONE,
        dueDate: { gte: expect.any(Date), lte: expect.any(Date) },
        OR: [
          { title: { contains: 'teste', mode: 'insensitive' } },
          { description: { contains: 'teste', mode: 'insensitive' } },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the task does not belong to the user', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the task owned by the user', async () => {
      prismaMock.task.findFirst.mockResolvedValue(taskRow());

      const task = await service.findOne(1, 1);

      expect(task.id).toBe(1);
      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
    });
  });

  describe('create', () => {
    it('creates the task, invalidates the cache and publishes an MQTT notification', async () => {
      prismaMock.task.create.mockResolvedValue(taskRow());
      // prime cache with a stale list
      await service.findAll(1, {});
      expect(prismaMock.task.findMany).toHaveBeenCalledTimes(1);

      const created = await service.create(1, { title: 'Nova tarefa' });

      expect(prismaMock.task.create).toHaveBeenCalled();
      expect(created.id).toBe(1);
      expect(mqttNotify).toHaveBeenCalledWith(1, { type: 'TASK_CREATED', taskId: 1 });

      // after creation the cached list must be gone
      expect(await cache.get('tasks:list:1:::::1:20')).toBeUndefined();
    });
  });

  describe('update / complete', () => {
    it('throws NotFoundException for a task the user does not own', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 42, { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('updates a task, invalidates the cache and notifies', async () => {
      prismaMock.task.findFirst.mockResolvedValue(taskRow());
      prismaMock.task.update.mockResolvedValue(taskRow({ status: TaskStatus.DONE }));

      await service.findAll(1, {});

      const updated = await service.complete(1, 1);

      expect(updated.status).toBe(TaskStatus.DONE);
      expect(mqttNotify).toHaveBeenCalled();
      expect(await cache.get('tasks:list:1:::::1:20')).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes the task, invalidates the cache and notifies', async () => {
      prismaMock.task.findFirst.mockResolvedValue(taskRow());
      prismaMock.task.delete.mockResolvedValue(taskRow());

      await service.findAll(1, {});

      await service.remove(1, 1);

      expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mqttNotify).toHaveBeenCalledWith(1, { type: 'TASK_DELETED', taskId: 1 });
      expect(await cache.get('tasks:list:1:::::1:20')).toBeUndefined();
    });
  });
});