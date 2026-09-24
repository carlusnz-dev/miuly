import { describe, expect, it } from 'vitest';
import {
  changePasswordBodySchema,
  toProfileResponse,
  toUserResponse,
  updateProfileBodySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from './contract';
import { makeUser } from './fixtures';

describe('updateUserBodySchema', () => {
  it('aceita nome e rejeita corpo vazio', () => {
    expect(updateUserBodySchema.parse({ name: ' Ana ' })).toEqual({
      name: 'Ana',
    });
    expect(updateUserBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('changePasswordBodySchema', () => {
  it('aplica a política de senha só na senha nova', () => {
    expect(
      changePasswordBodySchema.safeParse({
        currentPassword: '1',
        newPassword: 'senha-segura',
      }).success,
    ).toBe(true);
    expect(
      changePasswordBodySchema.safeParse({
        currentPassword: 'senha-segura',
        newPassword: 'curta',
      }).success,
    ).toBe(false);
  });
});

describe('updateProfileBodySchema', () => {
  it('normaliza o username e aceita null para limpar a foto', () => {
    expect(
      updateProfileBodySchema.parse({ username: 'Ana_1', urlPhoto: null }),
    ).toEqual({ username: 'ana_1', urlPhoto: null });
  });

  it.each([
    ['foto sem HTTPS', { urlPhoto: 'http://example.com/a.png' }],
    ['bio acima de 500', { bio: 'a'.repeat(501) }],
    ['corpo vazio', {}],
  ])('rejeita %s', (_caso, body) => {
    expect(updateProfileBodySchema.safeParse(body).success).toBe(false);
  });
});

describe('toProfileResponse', () => {
  it('omite userId e apresenta datas em ISO 8601', () => {
    const response = toProfileResponse({
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      userId: 1,
      username: 'ana',
      slugUrl: 'ana',
      bio: null,
      urlPhoto: null,
      createdAt: new Date('2026-09-23T12:00:00.000Z'),
      updatedAt: new Date('2026-09-23T12:00:00.000Z'),
    });

    expect(response).not.toHaveProperty('userId');
    expect(response.createdAt).toBe('2026-09-23T12:00:00.000Z');
  });
});

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
