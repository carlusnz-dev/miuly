import { BaseService } from '../../core/base';
import {
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../core/error';
import type { PasswordHasher } from '../../core/security/password';
import type { RateLimiter } from '../../core/security/rate-limiter';
import type { AuthContext } from '../../core/types/auth';
import {
  REFRESH_TOKEN_TTL_SECONDS,
  type AuthSession,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from './contract';
import type {
  AuthRepository,
  RevokeReason,
  StoredRefreshToken,
} from './repository';
import type { TokenService } from './tokens';

// Contrato público do service de autenticação (ADR 0002).
export interface AuthService {
  register(input: RegisterInput): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  refresh(refreshToken: string | undefined): Promise<AuthSession>;
  logout(refreshToken: string | undefined): Promise<void>;
  me(auth: AuthContext): Promise<AuthUser>;
  revokeAllSessions(userId: number, reason: RevokeReason): Promise<void>;
}

export interface AuthServiceDeps {
  passwords: PasswordHasher;
  tokens: TokenService;
  now?: () => Date;
  loginEmailLimiter?: RateLimiter;
}

export const LOGIN_EMAIL_FAILURE_LIMIT = 5;
export const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000;

// Renovações simultâneas de abas diferentes dentro desta janela recebem 409
// em vez de disparar a detecção de reuso.
export const ROTATION_GRACE_MS = 30_000;
// Sessões revogadas ou expiradas há mais tempo que isto são apagadas no login.
export const STALE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';
const INVALID_SESSION = 'Sessão inválida ou expirada';

export class AuthServiceImpl
  extends BaseService<AuthRepository>
  implements AuthService
{
  private readonly now: () => Date;
  // Hash de referência para comparar quando o e-mail não existe, deixando o
  // tempo de resposta parecido com o de uma senha errada.
  private dummyHash: Promise<string> | undefined;

  constructor(
    repository: AuthRepository,
    private readonly deps: AuthServiceDeps,
  ) {
    super(repository);
    this.now = deps.now ?? (() => new Date());
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const hashPassword = await this.deps.passwords.hash(input.password);
    const user = await this.repository.createAccount({
      name: input.name,
      email: input.email,
      username: input.username,
      hashPassword,
    });

    return this.startSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const failureKey = `login-email-failure:${normalizedEmail}`;
    if (this.deps.loginEmailLimiter) {
      const retryAfter = this.deps.loginEmailLimiter.consume(
        failureKey,
        LOGIN_EMAIL_FAILURE_LIMIT,
        LOGIN_EMAIL_WINDOW_MS,
      );
      if (retryAfter !== undefined) throw new TooManyRequestsError(retryAfter);
    }
    const credentials =
      await this.repository.findCredentialsByEmail(normalizedEmail);
    const stored = credentials?.hashPassword ?? (await this.getDummyHash());
    const valid = await this.deps.passwords.verify(input.password, stored);

    if (!credentials || !valid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    this.deps.loginEmailLimiter?.reset(failureKey);

    const cutoff = new Date(this.now().getTime() - STALE_SESSION_MS);
    await this.repository.deleteStaleSessions(credentials.user.id, cutoff);

    return this.startSession(credentials.user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    const stored = await this.findUsableToken(refreshToken);

    if (stored.successorCreatedAt) {
      await this.handleUsedToken(stored);
    }

    const next = this.newRefreshToken();
    const rotated = await this.repository.rotateRefreshToken(stored, next.row);

    // Outra requisição rotacionou o mesmo token entre a leitura e a escrita.
    if (!rotated) {
      throw new ConflictError('Sessão já renovada; tente novamente');
    }

    const user = await this.repository.findAuthUser(stored.userId);

    if (!user) {
      throw new UnauthorizedError(INVALID_SESSION);
    }

    return {
      user,
      accessToken: await this.issueAccessToken(user),
      refreshToken: next.token,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const stored = await this.repository.findRefreshToken(
      this.deps.tokens.hashRefreshToken(refreshToken),
    );

    if (stored && !stored.sessionRevokedAt) {
      await this.repository.revokeSession(
        stored.sessionId,
        'logout',
        this.now(),
      );
    }
  }

  async me(auth: AuthContext): Promise<AuthUser> {
    const user = await this.repository.findAuthUser(auth.userId);

    if (!user) {
      throw new UnauthorizedError(INVALID_SESSION);
    }

    return user;
  }

  async revokeAllSessions(userId: number, reason: RevokeReason): Promise<void> {
    await this.repository.revokeAllSessions(userId, reason, this.now());
  }

  private async findUsableToken(
    refreshToken: string | undefined,
  ): Promise<StoredRefreshToken> {
    if (!refreshToken) {
      throw new UnauthorizedError(INVALID_SESSION);
    }

    const stored = await this.repository.findRefreshToken(
      this.deps.tokens.hashRefreshToken(refreshToken),
    );

    if (
      !stored ||
      stored.sessionRevokedAt ||
      stored.expiresAt.getTime() <= this.now().getTime()
    ) {
      throw new UnauthorizedError(INVALID_SESSION);
    }

    return stored;
  }

  // Token que já tem sucessor: renovação concorrente (409) ou reuso (401 e
  // revogação de todas as sessões do usuário).
  private async handleUsedToken(stored: StoredRefreshToken): Promise<never> {
    const elapsed =
      this.now().getTime() - (stored.successorCreatedAt?.getTime() ?? 0);

    if (elapsed <= ROTATION_GRACE_MS) {
      throw new ConflictError('Sessão já renovada; tente novamente');
    }

    await this.repository.revokeAllSessions(stored.userId, 'reuse', this.now());
    throw new UnauthorizedError(INVALID_SESSION);
  }

  private async startSession(user: AuthUser): Promise<AuthSession> {
    const next = this.newRefreshToken();
    await this.repository.createSession(user.id, next.row);

    return {
      user,
      accessToken: await this.issueAccessToken(user),
      refreshToken: next.token,
    };
  }

  private newRefreshToken() {
    const token = this.deps.tokens.generateRefreshToken();
    const expiresAt = new Date(
      this.now().getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000,
    );

    return {
      token,
      row: { tokenHash: this.deps.tokens.hashRefreshToken(token), expiresAt },
    };
  }

  private issueAccessToken(user: AuthUser): Promise<string> {
    return this.deps.tokens.issueAccessToken({
      userId: user.id,
      profileId: user.profile.id,
    });
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.deps.passwords.hash('senha-de-referencia');
    return this.dummyHash;
  }
}
