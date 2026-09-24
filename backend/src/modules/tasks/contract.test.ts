import { describe, expect, it } from 'vitest';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskTagsSchema,
  toTagSlug,
  toTaskResponse,
  updateTaskBodySchema,
  type Task,
} from './contract';

describe('toTagSlug', () => {
  it.each([
    ['Casa', 'casa'],
    ['Saúde & Bem-estar', 'saude-bem-estar'],
    ['  Trabalho  2026 ', 'trabalho-2026'],
  ])('"%s" vira "%s"', (name, slug) => {
    expect(toTagSlug(name)).toBe(slug);
  });
});

describe('taskTagsSchema', () => {
  it('descarta repetições pelo slug mantendo a primeira', () => {
    expect(taskTagsSchema.parse(['Casa', ' casa ', 'Mercado'])).toEqual([
      'Casa',
      'Mercado',
    ]);
  });

  it.each([
    ['nome sem letra ou número', ['!!!']],
    ['nome acima de 30', ['a'.repeat(31)]],
    ['mais de 20 tags', Array.from({ length: 21 }, (_, i) => `t${i}`)],
  ])('rejeita %s', (_caso, tags) => {
    expect(taskTagsSchema.safeParse(tags).success).toBe(false);
  });
});

describe('createTaskBodySchema', () => {
  it('aplica padrões e converte datas', () => {
    const parsed = createTaskBodySchema.parse({
      title: ' Pagar boleto ',
      scheduledAt: '2026-09-25T09:00:00-03:00',
    });

    expect(parsed).toEqual({
      title: 'Pagar boleto',
      scheduledAt: new Date('2026-09-25T12:00:00.000Z'),
      priority: 'medium',
      peoples: [],
      tags: [],
    });
  });

  it.each([
    ['sem título', { title: '' }],
    ['título acima de 50', { title: 'a'.repeat(51) }],
    ['sem fuso', { scheduledAt: '2026-09-25T09:00:00' }],
    ['prioridade do banco', { priority: 'urgent' }],
    [
      'término antes do início',
      {
        startTime: '2026-09-25T10:00:00Z',
        endTime: '2026-09-25T09:00:00Z',
      },
    ],
  ])('rejeita %s', (_caso, override) => {
    const body = {
      title: 'Tarefa',
      scheduledAt: '2026-09-25T09:00:00Z',
      ...override,
    };

    expect(createTaskBodySchema.safeParse(body).success).toBe(false);
  });
});

describe('updateTaskBodySchema', () => {
  it('aceita atualização parcial', () => {
    expect(updateTaskBodySchema.parse({ done: true })).toEqual({ done: true });
  });

  it('aceita null para limpar observações', () => {
    expect(updateTaskBodySchema.parse({ observations: null })).toEqual({
      observations: null,
    });
  });

  it('rejeita corpo vazio', () => {
    expect(updateTaskBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('listTasksQuerySchema', () => {
  it('converte filtros da query string', () => {
    expect(
      listTasksQuerySchema.parse({ done: 'false', priority: 'high' }),
    ).toEqual({ page: 1, pageSize: 20, done: false, priority: 'high' });
  });

  it('rejeita intervalo invertido', () => {
    expect(
      listTasksQuerySchema.safeParse({
        from: '2026-09-30T00:00:00Z',
        to: '2026-09-01T00:00:00Z',
      }).success,
    ).toBe(false);
  });
});

describe('toTaskResponse', () => {
  it('apresenta datas em ISO 8601 e omite campos internos', () => {
    const task: Task = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      profileId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      title: 'Pagar boleto',
      observations: null,
      done: false,
      scheduledAt: new Date('2026-09-25T12:00:00.000Z'),
      priority: 'high',
      startTime: null,
      endTime: null,
      peoples: ['Ana'],
      tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }],
      status: true,
      createdAt: new Date('2026-09-24T12:00:00.000Z'),
      updatedAt: new Date('2026-09-24T12:00:00.000Z'),
    };

    expect(toTaskResponse(task)).toEqual({
      id: task.id,
      title: 'Pagar boleto',
      observations: null,
      done: false,
      scheduledAt: '2026-09-25T12:00:00.000Z',
      priority: 'high',
      startTime: null,
      endTime: null,
      peoples: ['Ana'],
      tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }],
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
    });
  });
});
