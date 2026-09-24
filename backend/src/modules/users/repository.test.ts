import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { makeInstant } from './fixtures';
import { PrismaUserRepository, toProfile, toUser } from './repository';

const instant = makeInstant('2026-01-02T03:04:05.678Z');

function fakeDatabase(
  model: 'User' | 'Profile',
  chain: Record<string, unknown>,
) {
  const where = vi.fn(() => chain);
  const database = {
    orm: { public: { [model]: { where } } },
  } as unknown as Database;

  return { database, where };
}

describe('mapeamento de linhas', () => {
  it('toUser mantém só os campos públicos e converte datas', () => {
    const row = {
      id: 3,
      name: 'Bia',
      email: 'bia@example.com',
      hashPassword: 'segredo',
      createdAt: instant,
      updatedAt: instant,
    };

    expect(toUser(row)).toEqual({
      id: 3,
      name: 'Bia',
      email: 'bia@example.com',
      createdAt: new Date('2026-01-02T03:04:05.678Z'),
      updatedAt: new Date('2026-01-02T03:04:05.678Z'),
    });
  });

  it('toProfile converte datas', () => {
    const profile = toProfile({
      id: 'p1',
      userId: 3,
      username: 'bia',
      slugUrl: 'bia',
      bio: null,
      urlPhoto: null,
      createdAt: instant,
      updatedAt: instant,
    });

    expect(profile.createdAt).toEqual(new Date('2026-01-02T03:04:05.678Z'));
  });
});

describe('PrismaUserRepository', () => {
  it('findById filtra pelo id e seleciona apenas campos públicos', async () => {
    const first = vi.fn(async () => null);
    const select = vi.fn(() => ({ first }));
    const { database, where } = fakeDatabase('User', { select });

    expect(await new PrismaUserRepository(database).findById(3)).toBeNull();
    expect(where).toHaveBeenCalledWith({ id: 3 });
    expect(select).toHaveBeenCalledWith(
      'id',
      'name',
      'email',
      'createdAt',
      'updatedAt',
    );
  });

  it('updateProfile envia só os campos presentes', async () => {
    const update = vi.fn(async () => null);
    const { database, where } = fakeDatabase('Profile', { update });

    await new PrismaUserRepository(database).updateProfile(3, { bio: null });

    expect(where).toHaveBeenCalledWith({ userId: 3 });
    expect(update).toHaveBeenCalledWith({ bio: null });
  });

  it('updateProfile traduz violação de unicidade em ConflictError', async () => {
    const update = vi.fn(async () => {
      throw Object.assign(new Error('duplicado'), { sqlState: '23505' });
    });
    const { database } = fakeDatabase('Profile', { update });

    await expect(
      new PrismaUserRepository(database).updateProfile(3, {
        username: 'bia',
        slugUrl: 'bia',
      }),
    ).rejects.toThrow(ConflictError);
  });
});
