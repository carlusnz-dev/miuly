import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './app';
import type { Database } from './prisma/database';

const database = {} as Database;

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

  it('responde 404 para rota inexistente', async () => {
    expect(await request('/nada')).toEqual({
      status: 404,
      body: { ok: false, message: 'Rota GET /nada não encontrada' },
    });
  });

  it('responde 400 para JSON malformado', async () => {
    const { status } = await request('/health', {
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
