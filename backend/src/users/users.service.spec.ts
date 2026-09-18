import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

describe('UsersService', () => {
  let service: UsersService;
  let cache: Cache;

  const userRow = {
    id: 1,
    email: 'joao@example.com',
    name: 'Joao',
    passwordHash: 'secret-hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    cache = createMemoryCache();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => vi.clearAllMocks());

  it('returns the cached profile without hitting the database', async () => {
    const cachedProfile = {
      id: 1,
      email: 'joao@example.com',
      name: 'Cached name',
      createdAt: new Date(),
    };
    await cache.set('user:profile:1', cachedProfile);

    const profile = await service.getProfile(1);

    expect(profile.name).toBe('Cached name');
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('fetches from the database and caches the profile on a cache miss', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRow);

    await service.getProfile(1);
    const cached = await service.getProfile(1);

    expect(cached).not.toHaveProperty('passwordHash');
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(await cache.get('user:profile:1')).toMatchObject({
      email: 'joao@example.com',
    });
  });

  it('updates the profile and refreshes the cache', async () => {
    prismaMock.user.update.mockResolvedValue({ ...userRow, name: 'Joao Silva' });

    const updated = await service.updateProfile(1, { name: 'Joao Silva' });

    expect(updated.name).toBe('Joao Silva');
    expect(updated).not.toHaveProperty('passwordHash');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Joao Silva' },
    });
    expect(await cache.get('user:profile:1')).toMatchObject({ name: 'Joao Silva' });
  });
});