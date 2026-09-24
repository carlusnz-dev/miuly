import type { User } from './contract';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Ana',
    email: 'ana@example.com',
    createdAt: new Date('2026-09-23T12:00:00.000Z'),
    updatedAt: new Date('2026-09-23T13:30:00.000Z'),
    ...overrides,
  };
}

// Equivalente estrutural do Temporal.Instant devolvido pelo codec do Prisma.
export function makeInstant(iso: string): { epochMilliseconds: number } {
  return { epochMilliseconds: Date.parse(iso) };
}
