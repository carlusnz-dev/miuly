import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { TaskController } from './controller';
import { makeTask, PROFILE_ID, TASK_ID } from './fixtures';
import type { TaskService } from './service';

function authenticated() {
  const res = fakeResponse();
  res.locals['auth'] = { userId: 1, profileId: PROFILE_ID };
  return res;
}

function makeController(service: Partial<TaskService>) {
  return new TaskController(service as TaskService);
}

describe('TaskController', () => {
  it('create usa o perfil do token e responde a tarefa com tags', async () => {
    const create = vi.fn(async () =>
      makeTask({ tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }] }),
    );
    const res = authenticated();

    await makeController({ create }).create(
      fakeRequest({
        body: {
          title: 'Mercado',
          scheduledAt: '2026-09-25T09:00:00-03:00',
          tags: ['Casa', 'casa'],
        },
      }),
      asResponse(res),
      fakeNext(),
    );

    expect(create).toHaveBeenCalledWith(
      PROFILE_ID,
      expect.objectContaining({ tags: ['Casa'], priority: 'medium' }),
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      data: { tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }] },
    });
  });

  it('list converte a query e responde paginado', async () => {
    const list = vi.fn(async () => ({
      items: [makeTask()],
      page: 1,
      pageSize: 20,
      total: 1,
    }));
    const res = authenticated();

    await makeController({ list }).list(
      fakeRequest({ query: { done: 'true', priority: 'high' } }),
      asResponse(res),
      fakeNext(),
    );

    expect(list).toHaveBeenCalledWith(PROFILE_ID, {
      page: 1,
      pageSize: 20,
      done: true,
      priority: 'high',
    });
    expect(res.body).toMatchObject({ pagination: { totalItems: 1 } });
  });

  it('update rejeita corpo vazio sem chamar o service', async () => {
    const update = vi.fn(async () => makeTask());

    await expect(
      makeController({ update }).update(
        fakeRequest({ params: { id: TASK_ID }, body: {} }),
        asResponse(authenticated()),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(update).not.toHaveBeenCalled();
  });
});
