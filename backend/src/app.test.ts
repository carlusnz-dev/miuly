import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { JoseTokenService } from './modules/auth/tokens';
import type { Database } from './prisma/database';

const SECRET = 'segredo-de-teste-com-32-caracteres!';
const PROFILE_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const instant = { epochMilliseconds: Date.parse('2026-09-23T12:00:00Z') };

// db falso: busca por id devolve a Ana; busca por e-mail (login) falha como
// um banco fora do ar, para verificar a resposta 500 genérica.
const database = {
  orm: {
    public: {
      User: {
        where: (filter: { id?: number; email?: string }) => ({
          select: () => ({
            first: async () =>
              filter.id === 1
                ? {
                    id: 1,
                    name: 'Ana',
                    email: 'ana@example.com',
                    createdAt: instant,
                    updatedAt: instant,
                  }
                : null,
          }),
          include: () => ({
            first: async () => {
              throw new Error('falha interna do banco');
            },
          }),
        }),
      },
    },
  },
} as unknown as Database;

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app({
    database,
    auth: {
      jwtSecret: SECRET,
      secureCookies: false,
    },
  }).listen(0);
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

  it('exige autenticação em /users', async () => {
    expect(await request('/users/me')).toEqual({
      status: 401,
      body: { ok: false, message: 'Autenticação necessária' },
    });
  });

  it('recusa token inválido', async () => {
    const { status } = await request('/auth/me', {
      headers: bearer('nao.e.jwt'),
    });

    expect(status).toBe(401);
  });

  it('GET /users/me responde o usuário do token', async () => {
    const token = await new JoseTokenService(SECRET).issueAccessToken({
      userId: 1,
      profileId: PROFILE_ID,
    });

    const { status, body } = await request('/users/me', {
      headers: bearer(token),
    });

    expect(status).toBe(200);
    expect(body.data).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T12:00:00.000Z',
    });
  });

  it('POST /auth/refresh sem cookie responde 401', async () => {
    const { status } = await request('/auth/refresh', { method: 'POST' });

    expect(status).toBe(401);
  });

  it('POST /auth/login valida o corpo', async () => {
    const { status, body } = await request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana' }),
    });

    expect(status).toBe(400);
    expect(body.issues).toEqual(
      expect.arrayContaining([
        { path: 'email', message: expect.any(String) },
        { path: 'password', message: expect.any(String) },
      ]),
    );
  });

  it('esconde detalhes de erros inesperados', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(
      await request('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'ana@example.com', password: 'x' }),
      }),
    ).toEqual({
      status: 500,
      body: { ok: false, message: 'Erro interno no servidor' },
    });
  });
});
