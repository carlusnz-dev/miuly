import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { ApiConnectionController } from './controller';
import { API_ID, makeApiConnection, PROFILE_ID } from './fixtures';
import type { ApiConnectionService } from './service';

function authenticated() {
  const res = fakeResponse();
  res.locals['auth'] = { userId: 1, profileId: PROFILE_ID };
  return res;
}

function makeController(service: Partial<ApiConnectionService>) {
  return new ApiConnectionController(service as ApiConnectionService);
}

describe('ApiConnectionController', () => {
  it('list usa o perfil do token e responde paginado', async () => {
    const list = vi.fn(async () => ({
      items: [makeApiConnection()],
      page: 1,
      pageSize: 20,
      total: 1,
    }));
    const res = authenticated();

    await makeController({ list }).list(
      fakeRequest({ query: { status: 'true' } }),
      asResponse(res),
      fakeNext(),
    );

    expect(list).toHaveBeenCalledWith(PROFILE_ID, {
      page: 1,
      pageSize: 20,
      status: true,
    });
    expect(res.body).toMatchObject({
      ok: true,
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
  });

  it('create responde 201', async () => {
    const create = vi.fn(async () => makeApiConnection());
    const res = authenticated();

    await makeController({ create }).create(
      fakeRequest({
        body: {
          title: 'Google Calendar',
          urlBase: 'https://www.googleapis.com',
          slugUrl: 'google-calendar',
        },
      }),
      asResponse(res),
      fakeNext(),
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).not.toHaveProperty('data.profileId');
  });

  it('rejeita id que não é UUID sem chamar o service', async () => {
    const findById = vi.fn(async () => makeApiConnection());

    await expect(
      makeController({ findById }).findById(
        fakeRequest({ params: { id: '1' } }),
        asResponse(authenticated()),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(findById).not.toHaveBeenCalled();
  });

  it('delete responde sem dados', async () => {
    const del = vi.fn(async () => {});
    const res = authenticated();

    await makeController({ delete: del }).delete(
      fakeRequest({ params: { id: API_ID } }),
      asResponse(res),
      fakeNext(),
    );

    expect(del).toHaveBeenCalledWith(PROFILE_ID, API_ID);
    expect(res.body).toEqual({
      ok: true,
      message: 'Conexão removida',
      data: null,
    });
  });
});
