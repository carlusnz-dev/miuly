import { describe, expect, it, vi } from 'vitest';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { AuthController } from './controller';
import { makeAuthUser } from './fixtures';
import type { AuthService } from './service';

const session = {
  user: makeAuthUser(),
  accessToken: 'access-token',
  refreshToken: 'refresh-secreto',
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/auth',
};

function makeController(service: Partial<AuthService>) {
  return new AuthController(service as AuthService, true);
}

describe('AuthController', () => {
  it('register responde 201, grava o cookie e não expõe o refresh token', async () => {
    const register = vi.fn(async () => session);
    const res = fakeResponse();

    await makeController({ register }).register(
      fakeRequest({
        body: {
          name: 'Ana',
          email: 'ana@example.com',
          username: 'ana',
          password: 'senha-certa',
        },
      }),
      asResponse(res),
      fakeNext(),
    );

    expect(res.statusCode).toBe(201);
    expect(res.cookies).toEqual([
      {
        name: 'miuly_refresh',
        value: 'refresh-secreto',
        cleared: false,
        options: { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 },
      },
    ]);
    expect(JSON.stringify(res.body)).not.toContain('refresh-secreto');
    expect(res.body).toMatchObject({
      ok: true,
      data: {
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    });
  });

  it('refresh lê o refresh token do cookie', async () => {
    const refresh = vi.fn(async () => session);

    await makeController({ refresh }).refresh(
      fakeRequest({ headers: { cookie: 'outro=1; miuly_refresh=abc' } }),
      asResponse(fakeResponse()),
      fakeNext(),
    );

    expect(refresh).toHaveBeenCalledWith('abc');
  });

  it('logout revoga pela sessão do cookie e apaga o cookie', async () => {
    const logout = vi.fn(async () => {});
    const res = fakeResponse();

    await makeController({ logout }).logout(
      fakeRequest({ headers: { cookie: 'miuly_refresh=abc' } }),
      asResponse(res),
      fakeNext(),
    );

    expect(logout).toHaveBeenCalledWith('abc');
    expect(res.cookies).toEqual([
      {
        name: 'miuly_refresh',
        cleared: true,
        options: cookieOptions,
      },
    ]);
    expect(res.body).toEqual({
      ok: true,
      message: 'Sessão encerrada',
      data: null,
    });
  });
});
