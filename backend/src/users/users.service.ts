import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import { sanitizeUser, type SafeUser } from '../common/sanitize-user.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const PROFILE_TTL_MS = 60_000;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getProfile(userId: number): Promise<SafeUser> {
    const cacheKey = this.profileCacheKey(userId);

    const cached = await this.cache.get<SafeUser>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = sanitizeUser(user);
    await this.cache.set(cacheKey, profile, PROFILE_TTL_MS);
    return profile;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
    });

    const profile = sanitizeUser(user);
    // Invalidate and refresh the cached profile.
    const cacheKey = this.profileCacheKey(userId);
    await this.cache.set(cacheKey, profile, PROFILE_TTL_MS);
    return profile;
  }

  private profileCacheKey(userId: number): string {
    return `user:profile:${userId}`;
  }
}