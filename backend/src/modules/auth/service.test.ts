import { describe, expect, it, vi } from 'vitest';
import {
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../core/error';
import type { PasswordHasher } from '../../core/security/password';
import { InMemoryRateLimiter } from '../../core/security/rate-limiter';
import { makeAuthUser, makeStoredToken } from './fixtures';
import type { AuthRepository } from './repository';
import {
  AuthServiceImpl,
  ROTATION_GRACE_MS,
  STALE_SESSION_MS,
  type AuthService,
} from './service';
import type { TokenService } from './tokens';

const NOW = new Date('2026-09-24T12:00:00Z');

function setup(
  overrides: Partial<AuthRepository> = {},
  loginEmailLimiter = new InMemoryRateLimiter(() => NOW.getTime()),
) {
  const repository: AuthRepository = {
    findCredentialsByEmail: vi.fn(async () => ({
      user: makeAuthUser(),
      hashPassword: 'hash-real',
    })),
    findAuthUser: vi.fn(async () => makeAuthUser()),
    createAccount: vi.fn(async () => makeAuthUser()),
    createSession: vi.fn(async () => {}),
    findRefreshToken: vi.fn(async () => makeStoredToken()),
    rotateRefreshToken: vi.fn(async () => true),
    revokeSession: vi.fn(async () => {}),
    revokeAllSessions: vi.fn(async () => {}),
    deleteStaleSessions: vi.fn(async () => {}),
    ...overrides,
  };
  const passwords: PasswordHasher = {
    hash: vi.fn(async (password) => `hash(${password})`),
    verify: vi.fn(
      async (password, stored) =>
        password === 'senha-certa' && stored === 'hash-real',
    ),
  };
  const tokens: TokenService = {
    issueAccessToken: vi.fn(async () => 'access-token'),
    verifyAccessToken: vi.fn(async () => null),
    generateRefreshToken: vi.fn(() => 'refresh-novo'),
    hashRefreshToken: vi.fn((token) => `sha(${token})`),
  };
  const service: AuthService = new AuthServiceImpl(repository, {
    passwords,
    tokens,
    now: () => NOW,
    loginEmailLimiter,
  });

  return { service, repository, passwords, tokens };
}

const expiresAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);

describe('AuthServiceImpl.register', () => {
  const input = {
    name: 'Ana',
    email: 'ana@example.com',
    username: 'ana',
    password: 'senha-certa',
  };

  it('cria a conta com a senha em hash e inicia a sessão', async () => {
    const { service, repository, tokens } = setup();

    const session = await service.register(input);

    expect(repository.createAccount).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@example.com',
      username: 'ana',
      hashPassword: 'hash(senha-certa)',
    });
    expect(repository.createSession).toHaveBeenCalledWith(1, {
      tokenHash: 'sha(refresh-novo)',
      expiresAt,
    });
    expect(tokens.issueAccessToken).toHaveBeenCalledWith({
      userId: 1,
      profileId: '0f8fad5b-d9cb-469f-a165-70867728950e',
    });
    expect(session).toEqual({
      user: makeAuthUser(),
      accessToken: 'access-token',
      refreshToken: 'refresh-novo',
    });
  });

  it('propaga o conflito de e-mail ou username sem criar sessão', async () => {
    const { service, repository } = setup({
      createAccount: vi.fn(async () => {
        throw new ConflictError('E-mail ou username já está em uso');
      }),
    });

    await expect(service.register(input)).rejects.toThrow(ConflictError);
    expect(repository.createSession).not.toHaveBeenCalled();
  });
});

describe('AuthServiceImpl.login', () => {
  it('inicia a sessão e apaga sessões revogadas ou expiradas antigas', async () => {
    const { service, repository } = setup();

    const session = await service.login({
      email: 'ana@example.com',
      password: 'senha-certa',
    });

    expect(session.refreshToken).toBe('refresh-novo');
    expect(repository.deleteStaleSessions).toHaveBeenCalledWith(
      1,
      new Date(NOW.getTime() - STALE_SESSION_MS),
    );
  });

  it('responde a mesma mensagem para senha errada e e-mail inexistente', async () => {
    const wrongPassword = setup();
    const unknownEmail = setup({
      findCredentialsByEmail: vi.fn(async () => null),
    });

    await expect(
      wrongPassword.service.login({ email: 'ana@example.com', password: 'x' }),
    ).rejects.toThrow(new UnauthorizedError('E-mail ou senha inválidos'));
    await expect(
      unknownEmail.service.login({
        email: 'nao@example.com',
        password: 'senha-certa',
      }),
    ).rejects.toThrow(new UnauthorizedError('E-mail ou senha inválidos'));
  });

  it('verifica um hash de referência quando o e-mail não existe', async () => {
    const { service, passwords, repository } = setup({
      findCredentialsByEmail: vi.fn(async () => null),
    });

    await expect(
      service.login({ email: 'nao@example.com', password: 'senha-certa' }),
    ).rejects.toThrow(UnauthorizedError);
    expect(passwords.verify).toHaveBeenCalledTimes(1);
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it('bloqueia a sexta tentativa antes do hasher e um sucesso limpa o contador', async () => {
    const limiter = new InMemoryRateLimiter(() => NOW.getTime());
    const failedLogin = setup(
      { findCredentialsByEmail: vi.fn(async () => null) },
      limiter,
    );
    const input = { email: 'ANA@EXAMPLE.COM', password: 'x' };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(failedLogin.service.login(input)).rejects.toThrow(
        UnauthorizedError,
      );
    }
    const successful = setup({}, limiter);
    await successful.service.login({
      email: 'ana@example.com',
      password: 'senha-certa',
    });
    const next = setup(
      { findCredentialsByEmail: vi.fn(async () => null) },
      limiter,
    );
    await expect(
      next.service.login({ email: 'ana@example.com', password: 'x' }),
    ).rejects.toThrow(UnauthorizedError);

    const blockedLimiter = new InMemoryRateLimiter(() => NOW.getTime());
    const blocked = setup(
      { findCredentialsByEmail: vi.fn(async () => null) },
      blockedLimiter,
    );
    const blockedInput = { email: 'ana@example.com', password: 'x' };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(blocked.service.login(blockedInput)).rejects.toThrow(
        UnauthorizedError,
      );
    }
    vi.mocked(blocked.passwords.verify).mockClear();
    await expect(blocked.service.login(blockedInput)).rejects.toThrow(
      TooManyRequestsError,
    );
    expect(blocked.passwords.verify).not.toHaveBeenCalled();
  });

  it('isola contadores de falhas entre e-mails e expira após a janela', async () => {
    let now = NOW.getTime();
    const limiter = new InMemoryRateLimiter(() => now);
    const failed = setup(
      { findCredentialsByEmail: vi.fn(async () => null) },
      limiter,
    );
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        failed.service.login({ email: 'a@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedError);
    }
    const otherEmail = setup(
      { findCredentialsByEmail: vi.fn(async () => null) },
      limiter,
    );
    await expect(
      otherEmail.service.login({ email: 'b@example.com', password: 'x' }),
    ).rejects.toThrow(UnauthorizedError);
    now += 15 * 60 * 1000;
    await expect(
      failed.service.login({ email: 'a@example.com', password: 'x' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe('AuthServiceImpl.refresh', () => {
  it('rotaciona o token e emite nova sessão', async () => {
    const { service, repository } = setup();

    const session = await service.refresh('refresh-antigo');

    expect(repository.findRefreshToken).toHaveBeenCalledWith(
      'sha(refresh-antigo)',
    );
    expect(repository.rotateRefreshToken).toHaveBeenCalledWith(
      makeStoredToken(),
      { tokenHash: 'sha(refresh-novo)', expiresAt },
    );
    expect(session.refreshToken).toBe('refresh-novo');
  });

  it.each([
    ['sem cookie', undefined, {}],
    ['token desconhecido', 'x', { findRefreshToken: vi.fn(async () => null) }],
    [
      'sessão revogada',
      'x',
      {
        findRefreshToken: vi.fn(async () =>
          makeStoredToken({ sessionRevokedAt: NOW }),
        ),
      },
    ],
    [
      'token expirado',
      'x',
      {
        findRefreshToken: vi.fn(async () =>
          makeStoredToken({ expiresAt: NOW }),
        ),
      },
    ],
    ['usuário removido', 'x', { findAuthUser: vi.fn(async () => null) }],
  ] as const)('responde 401 para %s', async (_caso, token, overrides) => {
    const { service } = setup(overrides as Partial<AuthRepository>);

    await expect(service.refresh(token)).rejects.toThrow(UnauthorizedError);
  });

  it('responde 409 sem revogar nada para renovação concorrente recente', async () => {
    const successorCreatedAt = new Date(NOW.getTime() - ROTATION_GRACE_MS);
    const { service, repository } = setup({
      findRefreshToken: vi.fn(async () =>
        makeStoredToken({ successorCreatedAt }),
      ),
    });

    await expect(service.refresh('x')).rejects.toThrow(ConflictError);
    expect(repository.revokeAllSessions).not.toHaveBeenCalled();
    expect(repository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('revoga todas as sessões quando um token usado reaparece depois da janela', async () => {
    const successorCreatedAt = new Date(NOW.getTime() - ROTATION_GRACE_MS - 1);
    const { service, repository } = setup({
      findRefreshToken: vi.fn(async () =>
        makeStoredToken({ successorCreatedAt }),
      ),
    });

    await expect(service.refresh('x')).rejects.toThrow(UnauthorizedError);
    expect(repository.revokeAllSessions).toHaveBeenCalledWith(1, 'reuse', NOW);
    expect(repository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('responde 409 quando outra requisição rotacionou primeiro', async () => {
    const { service, repository } = setup({
      rotateRefreshToken: vi.fn(async () => false),
    });

    await expect(service.refresh('x')).rejects.toThrow(ConflictError);
    expect(repository.revokeAllSessions).not.toHaveBeenCalled();
  });
});

describe('AuthServiceImpl.logout', () => {
  it('revoga a sessão do token apresentado', async () => {
    const { service, repository } = setup();

    await service.logout('refresh-atual');

    expect(repository.revokeSession).toHaveBeenCalledWith(
      'session-1',
      'logout',
      NOW,
    );
  });

  it('não faz nada sem cookie, com token desconhecido ou sessão já revogada', async () => {
    const semCookie = setup();
    const desconhecido = setup({ findRefreshToken: vi.fn(async () => null) });
    const revogada = setup({
      findRefreshToken: vi.fn(async () =>
        makeStoredToken({ sessionRevokedAt: NOW }),
      ),
    });

    await semCookie.service.logout(undefined);
    await desconhecido.service.logout('x');
    await revogada.service.logout('x');

    expect(semCookie.repository.findRefreshToken).not.toHaveBeenCalled();
    expect(desconhecido.repository.revokeSession).not.toHaveBeenCalled();
    expect(revogada.repository.revokeSession).not.toHaveBeenCalled();
  });
});

describe('AuthServiceImpl.me e revokeAllSessions', () => {
  it('me responde 401 quando o usuário do token não existe mais', async () => {
    const { service } = setup({ findAuthUser: vi.fn(async () => null) });

    await expect(service.me({ userId: 1, profileId: 'p' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('revokeAllSessions repassa o motivo e o instante atual', async () => {
    const { service, repository } = setup();

    await service.revokeAllSessions(1, 'password');

    expect(repository.revokeAllSessions).toHaveBeenCalledWith(
      1,
      'password',
      NOW,
    );
  });

  it('propaga falha de infraestrutura', async () => {
    const { service } = setup({
      createSession: vi.fn(async () => {
        throw new Error('banco indisponível');
      }),
    });

    await expect(
      service.login({ email: 'ana@example.com', password: 'senha-certa' }),
    ).rejects.toThrow('banco indisponível');
  });
});
