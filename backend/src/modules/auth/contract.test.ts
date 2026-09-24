import { describe, expect, it } from 'vitest';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  loginBodySchema,
  registerBodySchema,
  toAuthSessionResponse,
  type AuthSession,
} from './contract';

const validRegister = {
  name: 'Ana',
  email: 'ana@example.com',
  username: 'ana_souza',
  password: 'senha-segura',
};

describe('registerBodySchema', () => {
  it('normaliza e-mail e username', () => {
    const parsed = registerBodySchema.parse({
      ...validRegister,
      email: ' Ana@Example.COM ',
      username: ' Ana_Souza ',
    });

    expect(parsed.email).toBe('ana@example.com');
    expect(parsed.username).toBe('ana_souza');
  });

  it.each([
    ['e-mail inválido', { email: 'ana' }],
    ['username curto', { username: 'an' }],
    ['username com espaço', { username: 'ana souza' }],
    ['username com hífen', { username: 'ana-souza' }],
    ['senha curta', { password: '1234567' }],
    ['nome vazio', { name: '   ' }],
  ])('rejeita %s', (_caso, override) => {
    expect(
      registerBodySchema.safeParse({ ...validRegister, ...override }).success,
    ).toBe(false);
  });
});

describe('loginBodySchema', () => {
  it('não aplica a política de senha no login', () => {
    expect(
      loginBodySchema.safeParse({ email: 'ana@example.com', password: '1' })
        .success,
    ).toBe(true);
  });

  it('rejeita senha vazia', () => {
    expect(
      loginBodySchema.safeParse({ email: 'ana@example.com', password: '' })
        .success,
    ).toBe(false);
  });
});

describe('toAuthSessionResponse', () => {
  it('não expõe o refresh token no corpo', () => {
    const session: AuthSession = {
      accessToken: 'access',
      refreshToken: 'refresh-secreto',
      user: {
        id: 1,
        name: 'Ana',
        email: 'ana@example.com',
        profile: {
          id: '0f8fad5b-d9cb-469f-a165-70867728950e',
          username: 'ana',
          slugUrl: 'ana',
          urlPhoto: null,
        },
      },
    };

    const response = toAuthSessionResponse(session);

    expect(response).toEqual({
      accessToken: 'access',
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: session.user,
    });
    expect(JSON.stringify(response)).not.toContain('refresh-secreto');
  });
});
