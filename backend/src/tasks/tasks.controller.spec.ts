import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { TaskStatus } from '../generated/prisma/enums.js';

describe('TasksController', () => {
  let controller: TasksController;
  const serviceMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    remove: vi.fn(),
  };

  const user = { userId: 1, email: 'joao@example.com' } as const;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: serviceMock }],
    }).compile();

    controller = module.get(TasksController);
  });

  afterEach(() => vi.clearAllMocks());

  it('delegates list + filters to the service scoped by the current user', async () => {
    const query = { status: TaskStatus.DONE, page: 1, pageSize: 20 };
    await controller.findAll(user, query);
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, query);
  });

  it('delegates create to the service scoped by the current user', async () => {
    const dto = { title: 'Compra' };
    await controller.create(user, dto);
    expect(serviceMock.create).toHaveBeenCalledWith(1, dto);
  });

  it('delegates update to the service with the parsed id', async () => {
    const dto = { title: 'Nova' };
    await controller.update(user, 7, dto);
    expect(serviceMock.update).toHaveBeenCalledWith(1, 7, dto);
  });

  it('delegates remove and returns a confirmation flag', async () => {
    const result = await controller.remove(user, 3);
    expect(serviceMock.remove).toHaveBeenCalledWith(1, 3);
    expect(result).toEqual({ deleted: true });
  });
});