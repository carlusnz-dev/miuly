import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { makeTaskRow, PROFILE_ID, TASK_ID } from './fixtures';
import {
  PrismaTaskRepository,
  toStoredPriority,
  toTask,
  toTaskPriority,
} from './repository';

// tx falso com o mínimo usado pelo repository; cada chamada fica registrada.
function fakeTransaction(options: {
  existingTags?: { id: number; slugUrl: string }[];
  ownedRow?: unknown;
  createTagsError?: unknown;
  attempts?: {
    existingTags?: { id: number; slugUrl: string }[];
    createTagsError?: unknown;
  }[];
}) {
  let transactionIndex = 0;
  const calls = {
    taskCreate: vi.fn(async () => ({ id: TASK_ID })),
    taskUpdate: vi.fn(async () => ({})),
    tagWhere: vi.fn(),
    tagCreateAll: vi.fn(async (rows: { slugUrl: string }[]) => {
      if (options.createTagsError) throw options.createTagsError;
      return rows.map((row, index) => ({ id: 100 + index, ...row }));
    }),
    linkCreate: vi.fn(async () => 1),
    linkDelete: vi.fn(async () => 1),
  };
  const owned = 'ownedRow' in options ? options.ownedRow : makeTaskRow();
  const orm = {
    public: {
      Task: {
        create: calls.taskCreate,
        where: () => ({
          include: () => ({ first: async () => owned }),
          update: calls.taskUpdate,
        }),
      },
      Tag: {
        where: (filter: unknown) => calls.tagWhere(filter),
        createAll: calls.tagCreateAll,
      },
      TaskTag: {
        createAndCount: calls.linkCreate,
        where: () => ({ deleteAndCount: calls.linkDelete }),
      },
    },
  };
  const database = {
    transaction: async (fn: (tx: { orm: typeof orm }) => unknown) => {
      const attempt = options.attempts?.[transactionIndex];
      transactionIndex += 1;
      const configured = attempt ?? options;
      calls.tagCreateAll.mockImplementation(async (rows) => {
        if (configured.createTagsError) throw configured.createTagsError;
        return rows.map((row, index) => ({ id: 100 + index, ...row }));
      });
      calls.tagWhere.mockImplementation(() => ({
        where: () => ({
          select: () => ({
            all: async () => configured.existingTags ?? [],
          }),
        }),
      }));
      return fn({ orm });
    },
  } as unknown as Database;

  return { database, calls, transactionCount: () => transactionIndex };
}

const createInput = {
  title: 'Mercado',
  scheduledAt: new Date('2026-09-25T12:00:00Z'),
  priority: 'high' as const,
  peoples: [],
  tags: ['Casa', 'Compras'],
};

describe('prioridade', () => {
  it('traduz "high" da API para "urgent" do banco e de volta', () => {
    expect(toStoredPriority('high')).toBe('urgent');
    expect(toStoredPriority('low')).toBe('low');
    expect(toTaskPriority('urgent')).toBe('high');
    expect(toTaskPriority('archived')).toBe('archived');
  });
});

describe('toTask', () => {
  it('converte datas, prioridade e tags', () => {
    expect(toTask(makeTaskRow())).toMatchObject({
      priority: 'high',
      scheduledAt: new Date('2026-09-25T12:00:00Z'),
      startTime: null,
      tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }],
    });
  });
});

describe('PrismaTaskRepository.create', () => {
  it('reaproveita tags existentes, cria as novas e vincula na ordem pedida', async () => {
    const { database, calls } = fakeTransaction({
      existingTags: [{ id: 3, slugUrl: 'casa' }],
    });

    const task = await new PrismaTaskRepository(database).create(
      PROFILE_ID,
      createInput,
    );

    expect(calls.tagWhere).toHaveBeenCalledWith({ profileId: PROFILE_ID });
    expect(calls.tagCreateAll).toHaveBeenCalledWith([
      { profileId: PROFILE_ID, name: 'Compras', slugUrl: 'compras' },
    ]);
    expect(calls.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: PROFILE_ID, priority: 'urgent' }),
    );
    expect(calls.linkCreate).toHaveBeenCalledWith([
      { taskId: TASK_ID, tagId: 3 },
      { taskId: TASK_ID, tagId: 100 },
    ]);
    expect(task.id).toBe(TASK_ID);
  });

  it('não consulta nem vincula tags quando a lista é vazia', async () => {
    const { database, calls } = fakeTransaction({});

    await new PrismaTaskRepository(database).create(PROFILE_ID, {
      ...createInput,
      tags: [],
    });

    expect(calls.tagWhere).not.toHaveBeenCalled();
    expect(calls.linkCreate).not.toHaveBeenCalled();
  });

  it('repete uma vez a transação ao criar tags concorrentes', async () => {
    const { database, calls, transactionCount } = fakeTransaction({
      attempts: [
        {
          createTagsError: Object.assign(new Error('dup'), {
            sqlState: '23505',
          }),
        },
        {
          existingTags: [
            { id: 31, slugUrl: 'casa' },
            { id: 32, slugUrl: 'compras' },
          ],
        },
      ],
    });

    const task = await new PrismaTaskRepository(database).create(
      PROFILE_ID,
      createInput,
    );

    expect(task.id).toBe(TASK_ID);
    expect(transactionCount()).toBe(2);
    expect(calls.taskCreate).toHaveBeenCalledOnce();
    expect(calls.linkCreate).toHaveBeenCalledWith([
      { taskId: TASK_ID, tagId: 31 },
      { taskId: TASK_ID, tagId: 32 },
    ]);
  });

  it('mantém 409 depois de duas violações de unicidade', async () => {
    const duplicate = Object.assign(new Error('dup'), { sqlState: '23505' });
    const { database, transactionCount } = fakeTransaction({
      attempts: [
        { createTagsError: duplicate },
        { createTagsError: duplicate },
      ],
    });

    await expect(
      new PrismaTaskRepository(database).create(PROFILE_ID, createInput),
    ).rejects.toThrow(ConflictError);
    expect(transactionCount()).toBe(2);
  });

  it('não repete erros que não são de unicidade', async () => {
    const failure = new Error('indisponível');
    const { database, transactionCount } = fakeTransaction({
      createTagsError: failure,
      attempts: [{ createTagsError: failure }, {}],
    });

    await expect(
      new PrismaTaskRepository(database).create(PROFILE_ID, createInput),
    ).rejects.toBe(failure);
    expect(transactionCount()).toBe(1);
  });
});

describe('PrismaTaskRepository.update', () => {
  it('só com tags, substitui os vínculos sem atualizar a tarefa', async () => {
    const { database, calls } = fakeTransaction({
      existingTags: [{ id: 3, slugUrl: 'casa' }],
    });

    await new PrismaTaskRepository(database).update(PROFILE_ID, TASK_ID, {
      tags: ['Casa'],
    });

    expect(calls.taskUpdate).not.toHaveBeenCalled();
    expect(calls.linkDelete).toHaveBeenCalledOnce();
    expect(calls.linkCreate).toHaveBeenCalledWith([
      { taskId: TASK_ID, tagId: 3 },
    ]);
  });

  it('repete uma vez a transação do PATCH ao criar tags concorrentes', async () => {
    const { database, calls, transactionCount } = fakeTransaction({
      attempts: [
        {
          createTagsError: Object.assign(new Error('dup'), {
            sqlState: '23505',
          }),
        },
        { existingTags: [{ id: 31, slugUrl: 'casa' }] },
      ],
    });

    const task = await new PrismaTaskRepository(database).update(
      PROFILE_ID,
      TASK_ID,
      { tags: ['Casa'] },
    );

    expect(task?.id).toBe(TASK_ID);
    expect(transactionCount()).toBe(2);
    expect(calls.linkDelete).toHaveBeenCalledOnce();
    expect(calls.linkCreate).toHaveBeenCalledWith([
      { taskId: TASK_ID, tagId: 31 },
    ]);
  });

  it('sem tags no corpo, mantém os vínculos', async () => {
    const { database, calls } = fakeTransaction({});

    await new PrismaTaskRepository(database).update(PROFILE_ID, TASK_ID, {
      done: true,
    });

    expect(calls.taskUpdate).toHaveBeenCalledWith({ done: true });
    expect(calls.linkDelete).not.toHaveBeenCalled();
  });

  it('devolve null para tarefa de outro perfil sem alterar nada', async () => {
    const { database, calls } = fakeTransaction({ ownedRow: null });

    await expect(
      new PrismaTaskRepository(database).update(PROFILE_ID, TASK_ID, {
        done: true,
      }),
    ).resolves.toBeNull();
    expect(calls.taskUpdate).not.toHaveBeenCalled();
  });
});
