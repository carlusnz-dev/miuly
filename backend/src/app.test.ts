import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { makeInstant } from './modules/users/fixtures';
import type { Database } from './modules/users/repository';

const instant = makeInstant('2026-09-23T12:00:00Z');
const rows: Record<number, unknown> = {
  1: {
    id: 1,
    name: 'Ana',
    email: 'ana@example.com',
    createdAt: instant,
    updatedAt: instant,
  },
};

const database = {
  orm: {
    public: {
      User: {
        where: ({ id }: { id: number }) => ({
          select: () => ({
            first: async () => {
              if (id === 99) throw new Error('falha interna do banco');
              return rows[id] ?? null;
            },
          }),
        }),
      },
    },
  },
} as unknown as Database;

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app({ database }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

async function request(path: string, init?: RequestInit) {
  const res = await fetch(baseUrl + path, init);
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

describe('app', () => {
  it('GET /health responde no envelope de sucesso', async () => {
    expect(await request('/health')).toEqual({
      status: 200,
      body: { ok: true, message: 'Serviço disponível', data: { status: 'up' } },
    });
  });

  it('GET /users/:id responde o usuário', async () => {
    const { status, body } = await request('/users/1');

    expect(status).toBe(200);
    expect(body.data).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T12:00:00.000Z',
    });
  });

  it('GET /users/:id responde 404 para usuário inexistente', async () => {
    expect(await request('/users/2')).toEqual({
      status: 404,
      body: { ok: false, message: 'Usuário não encontrado' },
    });
  });

  it('GET /users/:id responde 400 para id inválido', async () => {
    const { status, body } = await request('/users/abc');

    expect(status).toBe(400);
    expect(body.issues).toEqual([{ path: 'id', message: expect.any(String) }]);
  });

  it('esconde detalhes de erros inesperados', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await request('/users/99')).toEqual({
      status: 500,
      body: { ok: false, message: 'Erro interno no servidor' },
    });
  });

  it('responde 404 para rota inexistente', async () => {
    expect(await request('/nada')).toEqual({
      status: 404,
      body: { ok: false, message: 'Rota GET /nada não encontrada' },
    });
  });

  it('responde 400 para JSON malformado', async () => {
    const { status } = await request('/users/1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ruim',
    });

    expect(status).toBe(400);
  });

  it('não expõe a rota /error fora do modo debug', async () => {
    expect((await request('/error')).status).toBe(404);
  });
});
