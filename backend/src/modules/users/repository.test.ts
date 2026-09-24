import { describe, expect, it, vi } from 'vitest';
import { makeInstant } from './fixtures';
import { PrismaUserRepository, type Database } from './repository';

function fakeDatabase(row: unknown) {
  const first = vi.fn(async () => row);
  const select = vi.fn(() => ({ first }));
  const where = vi.fn(() => ({ select }));
  const database = {
    orm: { public: { User: { where } } },
  } as unknown as Database;

  return { database, where, select };
}

describe('PrismaUserRepository.findById', () => {
  it('filtra pelo id e seleciona apenas campos públicos', async () => {
    const { database, where, select } = fakeDatabase(null);

    await new PrismaUserRepository(database).findById(3);

    expect(where).toHaveBeenCalledWith({ id: 3 });
    expect(select).toHaveBeenCalledWith(
      'id',
      'name',
      'email',
      'createdAt',
      'updatedAt',
    );
  });

  it('converte o instante do banco em Date', async () => {
    const { database } = fakeDatabase({
      id: 3,
      name: 'Bia',
      email: 'bia@example.com',
      createdAt: makeInstant('2026-01-02T03:04:05.678Z'),
      updatedAt: makeInstant('2026-02-03T04:05:06Z'),
    });

    const user = await new PrismaUserRepository(database).findById(3);

    expect(user).toEqual({
      id: 3,
      name: 'Bia',
      email: 'bia@example.com',
      createdAt: new Date('2026-01-02T03:04:05.678Z'),
      updatedAt: new Date('2026-02-03T04:05:06Z'),
    });
  });

  it('retorna null quando o usuário não existe', async () => {
    const { database } = fakeDatabase(null);

    expect(await new PrismaUserRepository(database).findById(9)).toBeNull();
  });
});
