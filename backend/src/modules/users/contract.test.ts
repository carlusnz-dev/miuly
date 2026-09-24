import { describe, expect, it } from 'vitest';
import { toUserResponse, userIdParamsSchema } from './contract';
import { makeUser } from './fixtures';

describe('userIdParamsSchema', () => {
  it('converte o id da URL para número', () => {
    expect(userIdParamsSchema.parse({ id: '15' })).toEqual({ id: 15 });
  });

  it('aceita o maior valor de int4', () => {
    expect(userIdParamsSchema.safeParse({ id: '2147483647' }).success).toBe(
      true,
    );
  });

  it.each(['abc', '0', '-1', '1.5', '2147483648'])('rejeita "%s"', (id) => {
    expect(userIdParamsSchema.safeParse({ id }).success).toBe(false);
  });
});

describe('toUserResponse', () => {
  it('apresenta datas em ISO 8601 e omite campos internos', () => {
    const user = { ...makeUser(), hashPassword: 'hash' };

    expect(toUserResponse(user)).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T13:30:00.000Z',
    });
  });
});
