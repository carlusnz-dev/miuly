import { describe, expect, it, vi } from 'vitest';
import { BadRequestError, NotFoundError } from '../../core/error';
import { makeTask, PROFILE_ID, TASK_ID } from './fixtures';
import type { TaskRepository } from './repository';
import { TaskServiceImpl, type TaskService } from './service';

function setup(overrides: Partial<TaskRepository> = {}) {
  const repository: TaskRepository = {
    list: vi.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })),
    findById: vi.fn(async () => makeTask()),
    create: vi.fn(async () => makeTask()),
    update: vi.fn(async () => makeTask()),
    delete: vi.fn(async () => true),
    ...overrides,
  };
  const service: TaskService = new TaskServiceImpl(repository);

  return { service, repository };
}

describe('TaskServiceImpl', () => {
  it('list repassa só os filtros informados', async () => {
    const { service, repository } = setup();
    const from = new Date('2026-09-01T00:00:00Z');

    await service.list(PROFILE_ID, {
      page: 1,
      pageSize: 20,
      done: false,
      from,
    });

    expect(repository.list).toHaveBeenCalledWith(PROFILE_ID, {
      page: 1,
      pageSize: 20,
      done: false,
      from,
    });
  });

  it('findById responde 404 para tarefa inexistente ou de outro perfil', async () => {
    const { service } = setup({ findById: vi.fn(async () => null) });

    await expect(service.findById(PROFILE_ID, TASK_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('update rejeita término novo anterior ao início salvo', async () => {
    const { service, repository } = setup();

    await expect(
      service.update(PROFILE_ID, TASK_ID, {
        endTime: new Date('2026-09-25T09:00:00Z'),
      }),
    ).rejects.toThrow(BadRequestError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('update só de tags não consulta o registro atual', async () => {
    const { service, repository } = setup();

    await service.update(PROFILE_ID, TASK_ID, { tags: ['Casa'] });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(PROFILE_ID, TASK_ID, {
      tags: ['Casa'],
    });
  });

  it('update responde 404 quando a tarefa não existe', async () => {
    const { service } = setup({ update: vi.fn(async () => null) });

    await expect(
      service.update(PROFILE_ID, TASK_ID, { done: true }),
    ).rejects.toThrow(NotFoundError);
  });

  it('delete responde 404 quando nada foi removido', async () => {
    const { service } = setup({ delete: vi.fn(async () => false) });

    await expect(service.delete(PROFILE_ID, TASK_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('propaga falha de infraestrutura', async () => {
    const { service } = setup({
      create: vi.fn(async () => {
        throw new Error('banco indisponível');
      }),
    });

    await expect(
      service.create(PROFILE_ID, {
        title: 'x',
        scheduledAt: new Date(),
        priority: 'low',
        peoples: [],
        tags: [],
      }),
    ).rejects.toThrow('banco indisponível');
  });
});
