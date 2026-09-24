import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { makeStoredToken } from './fixtures';
import { PrismaAuthRepository, toAuthUser } from './repository';

const uniqueViolation = () =>
  Object.assign(new Error('duplicado'), { sqlState: '23505' });

describe('toAuthUser', () => {
  const row = {
    id: 1,
    name: 'Ana',
    email: 'ana@example.com',
    hashPassword: 'segredo',
    profile: { id: 'p1', username: 'ana', slugUrl: 'ana', urlPhoto: null },
  };

  it('omite o hash da senha', () => {
    expect(toAuthUser(row)).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      profile: { id: 'p1', username: 'ana', slugUrl: 'ana', urlPhoto: null },
    });
  });

  it('retorna null para usuário sem perfil', () => {
    expect(toAuthUser({ ...row, profile: null })).toBeNull();
  });
});

describe('PrismaAuthRepository', () => {
  it('createAccount traduz violação de unicidade em ConflictError', async () => {
    const database = {
      transaction: vi.fn(async () => {
        throw uniqueViolation();
      }),
    } as unknown as Database;

    await expect(
      new PrismaAuthRepository(database).createAccount({
        name: 'Ana',
        email: 'ana@example.com',
        username: 'ana',
        hashPassword: 'hash',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rotateRefreshToken encadeia o token anterior', async () => {
    const create = vi.fn(async () => ({}));
    const database = {
      orm: { public: { RefreshToken: { create } } },
    } as unknown as Database;

    const rotated = await new PrismaAuthRepository(database).rotateRefreshToken(
      makeStoredToken(),
      {
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date('2026-10-01T00:00:00Z'),
      },
    );

    expect(rotated).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        userId: 1,
        previousTokenId: 'token-1',
        tokenHash: 'a'.repeat(64),
      }),
    );
  });

  it('rotateRefreshToken devolve false quando o token já tem sucessor', async () => {
    const create = vi.fn(async () => {
      throw uniqueViolation();
    });
    const database = {
      orm: { public: { RefreshToken: { create } } },
    } as unknown as Database;

    await expect(
      new PrismaAuthRepository(database).rotateRefreshToken(makeStoredToken(), {
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(),
      }),
    ).resolves.toBe(false);
  });

  it('findRefreshToken converte datas e indica o sucessor', async () => {
    const first = vi.fn(async () => ({
      id: 'token-1',
      sessionId: 'session-1',
      userId: 1,
      expiresAt: { epochMilliseconds: Date.parse('2026-10-01T00:00:00Z') },
      session: { revokedAt: null },
      nextToken: {
        createdAt: { epochMilliseconds: Date.parse('2026-09-24T12:00:00Z') },
      },
    }));
    const include = vi.fn(() => ({ include, first }));
    const where = vi.fn(() => ({ include }));
    const database = {
      orm: { public: { RefreshToken: { where } } },
    } as unknown as Database;

    await expect(
      new PrismaAuthRepository(database).findRefreshToken('a'.repeat(64)),
    ).resolves.toEqual(
      makeStoredToken({
        successorCreatedAt: new Date('2026-09-24T12:00:00Z'),
      }),
    );
    expect(include.mock.calls).toEqual([['session'], ['nextToken']]);
  });
});
