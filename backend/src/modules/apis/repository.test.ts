import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { API_ID, PROFILE_ID } from './fixtures';
import { PrismaApiConnectionRepository, toApiConnection } from './repository';

const instant = (iso: string) => ({ epochMilliseconds: Date.parse(iso) });

const row = {
  id: API_ID,
  profileId: PROFILE_ID,
  title: 'Google Calendar',
  description: null,
  urlBase: 'https://www.googleapis.com',
  slugUrl: 'google-calendar',
  startTime: instant('2026-09-24T10:00:00Z'),
  endTime: null,
  peoples: ['Ana'],
  status: true,
  createdAt: instant('2026-09-24T09:00:00Z'),
  updatedAt: instant('2026-09-24T09:00:00Z'),
};

function withApi(api: Record<string, unknown>) {
  return { orm: { public: { Api: api } } } as unknown as Database;
}

describe('toApiConnection', () => {
  it('converte instantes e preserva nulos', () => {
    expect(toApiConnection(row)).toMatchObject({
      startTime: new Date('2026-09-24T10:00:00Z'),
      endTime: null,
      peoples: ['Ana'],
    });
  });
});

describe('PrismaApiConnectionRepository', () => {
  it('list filtra pelo perfil, pagina e conta o total', async () => {
    const all = vi.fn(async () => [row]);
    const offset = vi.fn(() => ({ all }));
    const limit = vi.fn(() => ({ offset }));
    const orderBy = vi.fn(() => ({ limit }));
    const aggregate = vi.fn(async () => ({ total: 41 }));
    const scoped = { orderBy, aggregate, where: vi.fn() };
    scoped.where.mockReturnValue(scoped);
    const where = vi.fn(() => scoped);

    const page = await new PrismaApiConnectionRepository(
      withApi({ where }),
    ).list(PROFILE_ID, { page: 3, pageSize: 20, status: true });

    expect(where).toHaveBeenCalledWith({ profileId: PROFILE_ID });
    expect(scoped.where).toHaveBeenCalledWith({ status: true });
    expect(limit).toHaveBeenCalledWith(20);
    expect(offset).toHaveBeenCalledWith(40);
    expect(page).toMatchObject({ page: 3, pageSize: 20, total: 41 });
    expect(page.items).toHaveLength(1);
  });

  it('findById filtra por id e perfil', async () => {
    const first = vi.fn(async () => null);
    const where = vi.fn(() => ({ first }));

    await new PrismaApiConnectionRepository(withApi({ where })).findById(
      PROFILE_ID,
      API_ID,
    );

    expect(where).toHaveBeenCalledWith({ id: API_ID, profileId: PROFILE_ID });
  });

  it('update envia só os campos presentes e converte datas', async () => {
    const update = vi.fn(async () => row);
    const where = vi.fn(() => ({ update }));

    await new PrismaApiConnectionRepository(withApi({ where })).update(
      PROFILE_ID,
      API_ID,
      { endTime: null, status: false },
    );

    expect(update).toHaveBeenCalledWith({ endTime: null, status: false });
  });

  it('create traduz título duplicado em ConflictError', async () => {
    const create = vi.fn(async () => {
      throw Object.assign(new Error('duplicado'), { sqlState: '23505' });
    });

    await expect(
      new PrismaApiConnectionRepository(withApi({ create })).create(
        PROFILE_ID,
        {
          title: 'Google Calendar',
          urlBase: 'https://www.googleapis.com',
          slugUrl: 'google-calendar',
          peoples: [],
        },
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('delete indica se alguma linha do perfil foi removida', async () => {
    const del = vi.fn(async () => null);
    const where = vi.fn(() => ({ delete: del }));

    await expect(
      new PrismaApiConnectionRepository(withApi({ where })).delete(
        PROFILE_ID,
        API_ID,
      ),
    ).resolves.toBe(false);
    expect(where).toHaveBeenCalledWith({ id: API_ID, profileId: PROFILE_ID });
  });
});
