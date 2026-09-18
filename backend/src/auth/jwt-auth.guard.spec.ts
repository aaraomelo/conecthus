import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  const fakeContext = (request: object) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    }) as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        Reflector,
        JwtService,
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret' } },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    jwtService = module.get(JwtService);
    reflector = module.get(Reflector);
  });

  it('allows requests decorated with @Public()', async () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    await expect(guard.canActivate(fakeContext({ headers: {} }))).resolves.toBe(true);
    spy.mockRestore();
  });

  it('rejects requests without a bearer token', async () => {
    await expect(
      guard.canActivate(fakeContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects requests with an invalid token', async () => {
    await expect(
      guard.canActivate(
        fakeContext({ headers: { authorization: 'Bearer not.a.jwt' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid token and attaches the user to the request', async () => {
    const token = await jwtService.signAsync(
      { email: 'joao@example.com' },
      { secret: 'test-secret', subject: '1' },
    );

    const request: { user?: unknown; headers: Record<string, string> } = {
      headers: { authorization: `Bearer ${token}` },
    };

    await expect(guard.canActivate(fakeContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 1, email: 'joao@example.com' });
  });
});