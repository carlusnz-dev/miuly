import { describe, expect, it } from 'vitest';
import {
  createApiBodySchema,
  listApisQuerySchema,
  toApiConnectionResponse,
  updateApiBodySchema,
  type ApiConnection,
} from './contract';

const validApi = {
  title: 'Google Calendar',
  urlBase: 'https://www.googleapis.com',
  slugUrl: 'google-calendar',
};

describe('createApiBodySchema', () => {
  it('aceita o mínimo e aplica padrões', () => {
    expect(createApiBodySchema.parse(validApi)).toEqual({
      ...validApi,
      peoples: [],
    });
  });

  it.each([
    ['URL sem HTTPS', { urlBase: 'http://example.com' }],
    ['URL inválida', { urlBase: 'example' }],
    ['slug com espaço', { slugUrl: 'google calendar' }],
    ['slug acima de 30', { slugUrl: 'a'.repeat(31) }],
    [
      'término antes do início',
      { startTime: '2026-09-25T10:00:00Z', endTime: '2026-09-25T09:00:00Z' },
    ],
  ])('rejeita %s', (_caso, override) => {
    expect(
      createApiBodySchema.safeParse({ ...validApi, ...override }).success,
    ).toBe(false);
  });
});

describe('updateApiBodySchema', () => {
  it('permite desativar a conexão', () => {
    expect(updateApiBodySchema.parse({ status: false })).toEqual({
      status: false,
    });
  });

  it('rejeita corpo vazio', () => {
    expect(updateApiBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('listApisQuerySchema', () => {
  it('converte o filtro de status', () => {
    expect(listApisQuerySchema.parse({ status: 'true' })).toEqual({
      page: 1,
      pageSize: 20,
      status: true,
    });
  });
});

describe('toApiConnectionResponse', () => {
  it('apresenta datas em ISO 8601 e omite o perfil', () => {
    const api: ApiConnection = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      profileId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      title: 'Google Calendar',
      description: null,
      urlBase: 'https://www.googleapis.com',
      slugUrl: 'google-calendar',
      startTime: new Date('2026-09-24T12:00:00.000Z'),
      endTime: null,
      peoples: [],
      status: true,
      createdAt: new Date('2026-09-24T12:00:00.000Z'),
      updatedAt: new Date('2026-09-24T12:00:00.000Z'),
    };

    const response = toApiConnectionResponse(api);

    expect(response).not.toHaveProperty('profileId');
    expect(response.startTime).toBe('2026-09-24T12:00:00.000Z');
    expect(response.endTime).toBeNull();
  });
});
