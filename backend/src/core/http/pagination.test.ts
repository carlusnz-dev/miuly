import { describe, expect, it } from 'vitest';
import {
  MAX_PAGE_SIZE,
  paginationQuerySchema,
  toPaginationMeta,
} from './pagination';

describe('paginationQuerySchema', () => {
  it('usa página 1 e 20 itens por padrão', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('converte valores da query string', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { pageSize: '0' },
    { pageSize: String(MAX_PAGE_SIZE + 1) },
  ])('rejeita %o', (query) => {
    expect(paginationQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('toPaginationMeta', () => {
  it('calcula o total de páginas arredondando para cima', () => {
    expect(
      toPaginationMeta({ items: [], page: 2, pageSize: 10, total: 21 }),
    ).toEqual({ page: 2, pageSize: 10, totalItems: 21, totalPages: 3 });
  });

  it('retorna zero páginas quando não há itens', () => {
    expect(
      toPaginationMeta({ items: [], page: 1, pageSize: 20, total: 0 }),
    ).toMatchObject({ totalItems: 0, totalPages: 0 });
  });
});
