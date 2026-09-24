import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import {
  asResponse,
  fakeNext,
  fakeRequest,
  fakeResponse,
} from '../../test/http';
import { UserController } from './controller';
import { makeUser } from './fixtures';
import type { UserService } from './service';

function makeController(findById: UserService['findById']) {
  return new UserController({ findById } as UserService);
}

describe('UserController.findById', () => {
  it('converte o id, chama o service e responde o DTO', async () => {
    const findById = vi.fn(async () => makeUser({ id: 8 }));
    const res = fakeResponse();

    await makeController(findById).findById(
      fakeRequest({ params: { id: '8' } }),
      asResponse(res),
      fakeNext(),
    );

    expect(findById).toHaveBeenCalledWith(8);
    expect(res.statusCode).toBe(200);
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

  it('não chama o service quando o id é inválido', async () => {
    const findById = vi.fn(async () => makeUser());

    await expect(
      makeController(findById).findById(
        fakeRequest({ params: { id: 'abc' } }),
        asResponse(fakeResponse()),
        fakeNext(),
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(findById).not.toHaveBeenCalled();
  });
});
