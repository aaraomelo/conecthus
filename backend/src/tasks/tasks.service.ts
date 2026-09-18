import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import { MqttService } from '../mqtt/mqtt.service.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import type { TaskQueryDto } from './dto/task-query.dto.js';
import type { TaskListResponse } from './dto/task-response.dto.js';
import type { Task } from '../generated/prisma/client.js';
import { TaskStatus } from '../generated/prisma/enums.js';

const LIST_TTL_MS = 60_000;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(userId: number, query: TaskQueryDto): Promise<TaskListResponse> {
    const { status, dueDateFrom, dueDateTo, search, page = 1, pageSize = 20 } = query;
    const cacheKey = this.listCacheKey(userId, query);

    const cached = await this.cache.get<TaskListResponse>(cacheKey);
    if (cached) return cached;

    const where = {
      userId,
      ...(status ? { status } : {}),
      ...(dueDateFrom || dueDateTo
        ? {
            dueDate: {
              ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
              ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    const response: TaskListResponse = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    await this.cache.set(cacheKey, response, LIST_TTL_MS);
    await this.trackListKey(userId, cacheKey);

    return response;
  }

  async findOne(userId: number, id: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: number, dto: CreateTaskDto): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId,
      },
    });

    await this.invalidateTasksCache(userId);
    this.mqttService.notify(userId, { type: 'TASK_CREATED', taskId: task.id });

    return task;
  }

  async update(userId: number, id: number, dto: UpdateTaskDto): Promise<Task> {
    await this.ensureOwnedTask(userId, id);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
      },
    });

    await this.invalidateTasksCache(userId);
    this.mqttService.notify(userId, { type: 'TASK_UPDATED', taskId: task.id });

    return task;
  }

  async complete(userId: number, id: number): Promise<Task> {
    await this.ensureOwnedTask(userId, id);

    const task = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE },
    });

    await this.invalidateTasksCache(userId);
    this.mqttService.notify(userId, { type: 'TASK_UPDATED', taskId: task.id });

    return task;
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.ensureOwnedTask(userId, id);

    await this.prisma.task.delete({ where: { id } });
    await this.invalidateTasksCache(userId);
    this.mqttService.notify(userId, { type: 'TASK_DELETED', taskId: id });
  }

  private async ensureOwnedTask(userId: number, id: number): Promise<void> {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
  }

  private listCacheKey(userId: number, query: TaskQueryDto): string {
    const { status = '', dueDateFrom = '', dueDateTo = '', search = '', page = 1, pageSize = 20 } = query;
    return `tasks:list:${userId}:${status}:${dueDateFrom}:${dueDateTo}:${search}:${page}:${pageSize}`;
  }

  private async trackListKey(userId: number, cacheKey: string): Promise<void> {
    const indexKey = this.listIndexKey(userId);
    const keys = (await this.cache.get<string[]>(indexKey)) ?? [];
    if (!keys.includes(cacheKey)) {
      keys.push(cacheKey);
      await this.cache.set(indexKey, keys, LIST_TTL_MS * 10);
    }
  }

  private async invalidateTasksCache(userId: number): Promise<void> {
    const indexKey = this.listIndexKey(userId);
    const keys = (await this.cache.get<string[]>(indexKey)) ?? [];
    for (const key of keys) {
      await this.cache.del(key);
    }
    await this.cache.del(indexKey);
  }

  private listIndexKey(userId: number): string {
    return `tasks:index:${userId}`;
  }
}