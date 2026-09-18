import type { User } from '../generated/prisma/client.js';

export type SafeUser = Omit<User, 'passwordHash'>;

export function sanitizeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}