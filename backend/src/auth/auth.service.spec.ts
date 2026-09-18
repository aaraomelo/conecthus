import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let jwtSignAsync: ReturnType<typeof vi.fn>;
  let configGet: ReturnType<typeof vi.fn>;

  const userRow = {
    id: 1,
    email: 'joao@example.com',
    name: 'Joao',
    passwordHash: 'hashed-value',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    jwtSignAsync = vi.fn().mockResolvedValue('signed-jwt');
    configGet = vi.fn().mockReturnValue('10');

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { signAsync: jwtSignAsync } },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('hashes the password, creates the user and returns a token + safe user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(userRow);

      const result = await service.register({
        email: userRow.email,
        name: userRow.name,
        password: 'superSecret123',
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: userRow.email,
            name: userRow.name,
          }),
        }),
      );

      // Password hash passed to Prisma is a bcrypt hash, not the raw password.
      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('superSecret123');
      expect(createCall.data.passwordHash).toMatch(/^\$2[aby]\$/);

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user.id).toBe(userRow.id);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtSignAsync).toHaveBeenCalledWith(
        { email: userRow.email },
        { subject: String(userRow.id) },
      );
    });

    it('throws ConflictException when the email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRow);

      await expect(
        service.register({
          email: userRow.email,
          name: 'Outro',
          password: 'superSecret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'superSecret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const storedHash = await hash('correct-password', 4);
      prismaMock.user.findUnique.mockResolvedValue({ ...userRow, passwordHash: storedHash });

      await expect(
        service.login({ email: userRow.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a token and the safe user for valid credentials', async () => {
      const storedHash = await hash('correct-password', 4);
      prismaMock.user.findUnique.mockResolvedValue({ ...userRow, passwordHash: storedHash });

      const result = await service.login({
        email: userRow.email,
        password: 'correct-password',
      });

      expect(jwtSignAsync).toHaveBeenCalled();
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});