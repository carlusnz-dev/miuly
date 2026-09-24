import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { UnauthorizedError } from '../../core/error';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { UserController } from './controller';
import { makeProfile, makeUser } from './fixtures';
import type { UserService } from './service';

const auth = { userId: 8, profileId: '0f8fad5b-d9cb-469f-a165-70867728950e' };

function authenticated() {
  const res = fakeResponse();
  res.locals['auth'] = auth;
  return res;
}

function makeController(service: Partial<UserService>) {
  return new UserController(service as UserService);
}

describe('UserController', () => {
  it('findMe usa o usuário autenticado e responde o DTO', async () => {
    const findMe = vi.fn(async () => makeUser({ id: 8 }));
    const res = authenticated();

    await makeController({ findMe }).findMe(
      fakeRequest(),
      asResponse(res),
      fakeNext(),
    );

    expect(findMe).toHaveBeenCalledWith(8);
    expect(res.body).toEqual({
      ok: true,
      message: 'Usuário encontrado',
      data: {
        id: 8,
        name: 'Ana',
        email: 'ana@example.com',
        createdAt: '2026-09-23T12:00:00.000Z',
        updatedAt: '2026-09-23T13:30:00.000Z',
      },
    });
  });

  it('recusa requisição sem autenticação', async () => {
    const findMe = vi.fn(async () => makeUser());

    await expect(
      makeController({ findMe }).findMe(
        fakeRequest(),
        asResponse(fakeResponse()),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(findMe).not.toHaveBeenCalled();
  });

  it('updateMyProfile valida o corpo antes de chamar o service', async () => {
    const updateMyProfile = vi.fn(async () => makeProfile());

    await expect(
      makeController({ updateMyProfile }).updateMyProfile(
        fakeRequest({ body: {} }),
        asResponse(authenticated()),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('changePassword responde sem dados', async () => {
    const changePassword = vi.fn(async () => {});
    const res = authenticated();

    await makeController({ changePassword }).changePassword(
      fakeRequest({
        body: { currentPassword: 'senha-atual', newPassword: 'senha-nova-1' },
      }),
      asResponse(res),
      fakeNext(),
    );

    expect(changePassword).toHaveBeenCalledWith(8, {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-1',
    });
    expect(res.body).toEqual({
      ok: true,
      message: 'Senha alterada; entre novamente',
      data: null,
    });
  });
});
