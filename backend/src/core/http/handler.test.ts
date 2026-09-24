import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { handler, paginatedHandler } from './handler';

describe('handler', () => {
  it('valida params, query e body e entrega os dados convertidos', async () => {
    const execute = vi.fn(async () => ({ value: 42 }));
    const route = handler({
      schemas: {
        params: z.object({ id: z.coerce.number() }),
        query: z.object({ q: z.string() }),
        body: z.object({ name: z.string() }),
      },
      execute,
      present: (result) => result.value,
    });
    const res = fakeResponse();

    await route(
      fakeRequest({
        params: { id: '7' },
        query: { q: 'x' },
        body: { name: 'a' },
      }),
      asResponse(res),
      fakeNext(),
    );

    expect(execute).toHaveBeenCalledWith({
      params: { id: 7 },
      query: { q: 'x' },
      body: { name: 'a' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      message: 'Requisição concluída com sucesso',
      data: 42,
    });
  });

  it('usa status e mensagem configurados', async () => {
    const route = handler({
      status: 201,
      message: 'Criado',
      execute: async () => [1, 2],
      present: (items) => items,
    });
    const res = fakeResponse();

    await route(fakeRequest(), asResponse(res), fakeNext());

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ ok: true, message: 'Criado', data: [1, 2] });
  });

  it('entrega undefined para partes sem schema', async () => {
    const execute = vi.fn(async () => null);
    const route = handler({ execute, present: () => null });

    await route(
      fakeRequest({ params: { id: '1' }, body: { x: 1 } }),
      asResponse(fakeResponse()),
      fakeNext(),
    );

    expect(execute).toHaveBeenCalledWith({
      params: undefined,
      query: undefined,
      body: undefined,
    });
  });

  it('lança ZodError sem chamar execute quando a entrada é inválida', async () => {
    const execute = vi.fn(async () => null);
    const route = handler({
      schemas: { params: z.object({ id: z.coerce.number().int() }) },
      execute,
      present: () => null,
    });
    const res = fakeResponse();

    await expect(
      route(
        fakeRequest({ params: { id: 'abc' } }),
        asResponse(res),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(execute).not.toHaveBeenCalled();
    expect(res.body).toBeUndefined();
  });
});

describe('paginatedHandler', () => {
  it('converte cada item e inclui os metadados de paginação', async () => {
    const route = paginatedHandler({
      execute: async () => ({
        items: [{ n: 1 }, { n: 2 }],
        page: 1,
        pageSize: 2,
        total: 5,
      }),
      present: (item) => item.n * 10,
    });
    const res = fakeResponse();

    await route(fakeRequest(), asResponse(res), fakeNext());

    expect(res.body).toEqual({
      ok: true,
      message: 'Requisição concluída com sucesso',
      data: [10, 20],
      pagination: { page: 1, pageSize: 2, totalItems: 5, totalPages: 3 },
    });
  });
});
