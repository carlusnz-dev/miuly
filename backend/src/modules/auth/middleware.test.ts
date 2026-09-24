import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '../../core/error';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { requireAuth } from './middleware';
import type { TokenService } from './tokens';

const context = {
  userId: 7,
  profileId: '0f8fad5b-d9cb-469f-a165-70867728950e',
};

function tokens(result: typeof context | null): TokenService {
  return {
    issueAccessToken: vi.fn(),
    verifyAccessToken: vi.fn(async () => result),
    generateRefreshToken: vi.fn(),
    hashRefreshToken: vi.fn(),
  };
}

describe('requireAuth', () => {
  it('grava o AuthContext e segue para a rota', async () => {
    const service = tokens(context);
    const res = fakeResponse();
    const next = fakeNext();

    await requireAuth(service)(
      fakeRequest({ headers: { authorization: 'Bearer abc.def.ghi' } }),
      asResponse(res),
      next,
    );

    expect(service.verifyAccessToken).toHaveBeenCalledWith('abc.def.ghi');
    expect(res.locals['auth']).toEqual(context);
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([undefined, '', 'abc.def.ghi', 'Basic abc', 'Bearer ', 'Bearer a b'])(
    'responde 401 para o cabeçalho %j',
    async (authorization) => {
      const service = tokens(context);
      const next = fakeNext();

      await expect(
        requireAuth(service)(
          fakeRequest({ headers: authorization ? { authorization } : {} }),
          asResponse(fakeResponse()),
          next,
        ),
      ).rejects.toThrow(UnauthorizedError);
      expect(service.verifyAccessToken).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    },
  );

  it('responde 401 para token inválido ou expirado', async () => {
    const next = fakeNext();

    await expect(
      requireAuth(tokens(null))(
        fakeRequest({ headers: { authorization: 'Bearer abc.def.ghi' } }),
        asResponse(fakeResponse()),
        next,
      ),
    ).rejects.toThrow('Token inválido ou expirado');
    expect(next).not.toHaveBeenCalled();
  });
});
