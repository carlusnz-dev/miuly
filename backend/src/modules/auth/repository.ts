import { BaseRepository } from '../../core/base';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { isUniqueViolation } from '../../prisma/errors';
import { toDate, toInstant, toNullableDate } from '../../prisma/instant';
import { varchar } from '../../prisma/varchar';
import type { AuthUser } from './contract';

export type RevokeReason = 'logout' | 'password' | 'reuse';

export interface NewAccount {
  name: string;
  email: string;
  username: string;
  hashPassword: string;
}

export interface Credentials {
  user: AuthUser;
  hashPassword: string;
}

export interface NewRefreshToken {
  tokenHash: string;
  expiresAt: Date;
}

export interface StoredRefreshToken {
  id: string;
  sessionId: string;
  userId: number;
  expiresAt: Date;
  sessionRevokedAt: Date | null;
  // Instante em que o sucessor foi emitido; null se este é o token atual.
  successorCreatedAt: Date | null;
}

export interface AuthRepository {
  findCredentialsByEmail(email: string): Promise<Credentials | null>;
  findAuthUser(userId: number): Promise<AuthUser | null>;
  // Cria usuário e perfil na mesma transação; ConflictError se e-mail ou
  // username já existirem.
  createAccount(account: NewAccount): Promise<AuthUser>;
  createSession(userId: number, token: NewRefreshToken): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<StoredRefreshToken | null>;
  // false quando o token anterior já tem sucessor (rotação concorrente).
  rotateRefreshToken(
    previous: StoredRefreshToken,
    next: NewRefreshToken,
  ): Promise<boolean>;
  revokeSession(
    sessionId: string,
    reason: RevokeReason,
    at: Date,
  ): Promise<void>;
  revokeAllSessions(
    userId: number,
    reason: RevokeReason,
    at: Date,
  ): Promise<void>;
  deleteSessionsRevokedBefore(userId: number, before: Date): Promise<void>;
}

interface UserWithProfileRow {
  id: number;
  name: string;
  email: string;
  hashPassword: string;
  profile: {
    id: string;
    username: string;
    slugUrl: string;
    urlPhoto: string | null;
  } | null;
}

export function toAuthUser(row: UserWithProfileRow): AuthUser | null {
  if (!row.profile) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profile: {
      id: row.profile.id,
      username: row.profile.username,
      slugUrl: row.profile.slugUrl,
      urlPhoto: row.profile.urlPhoto,
    },
  };
}

export class PrismaAuthRepository
  extends BaseRepository<Database>
  implements AuthRepository
{
  async findCredentialsByEmail(email: string): Promise<Credentials | null> {
    const row = await this.db.orm.public.User.where({
      email: varchar(email, 100),
    })
      .include('profile')
      .first();
    const user = row ? toAuthUser(row) : null;

    return row && user ? { user, hashPassword: row.hashPassword } : null;
  }

  async findAuthUser(userId: number): Promise<AuthUser | null> {
    const row = await this.db.orm.public.User.where({ id: userId })
      .include('profile')
      .first();

    return row ? toAuthUser(row) : null;
  }

  async createAccount(account: NewAccount): Promise<AuthUser> {
    try {
      return await this.db.transaction(async (tx) => {
        const user = await tx.orm.public.User.create({
          name: varchar(account.name, 255),
          email: varchar(account.email, 100),
          hashPassword: varchar(account.hashPassword, 255),
        });
        const profile = await tx.orm.public.Profile.create({
          userId: user.id,
          username: varchar(account.username, 100),
          email: varchar(account.email, 100),
          slugUrl: varchar(account.username, 30),
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: {
            id: profile.id,
            username: profile.username,
            slugUrl: profile.slugUrl,
            urlPhoto: profile.urlPhoto,
          },
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('E-mail ou username já está em uso');
      }

      throw error;
    }
  }

  async createSession(userId: number, token: NewRefreshToken): Promise<void> {
    await this.db.transaction(async (tx) => {
      const session = await tx.orm.public.Session.create({ userId });

      await tx.orm.public.RefreshToken.create({
        sessionId: session.id,
        userId,
        tokenHash: varchar(token.tokenHash, 64),
        expiresAt: toInstant(token.expiresAt),
      });
    });
  }

  async findRefreshToken(
    tokenHash: string,
  ): Promise<StoredRefreshToken | null> {
    const row = await this.db.orm.public.RefreshToken.where({
      tokenHash: varchar(tokenHash, 64),
    })
      .include('session')
      .include('nextToken')
      .first();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      sessionId: row.sessionId,
      userId: row.userId,
      expiresAt: toDate(row.expiresAt),
      sessionRevokedAt: toNullableDate(row.session.revokedAt),
      successorCreatedAt: row.nextToken
        ? toDate(row.nextToken.createdAt)
        : null,
    };
  }

  async rotateRefreshToken(
    previous: StoredRefreshToken,
    next: NewRefreshToken,
  ): Promise<boolean> {
    try {
      await this.db.orm.public.RefreshToken.create({
        sessionId: previous.sessionId,
        userId: previous.userId,
        previousTokenId: previous.id,
        tokenHash: varchar(next.tokenHash, 64),
        expiresAt: toInstant(next.expiresAt),
      });

      return true;
    } catch (error) {
      // previousTokenId é único: outra requisição já rotacionou este token.
      if (isUniqueViolation(error)) {
        return false;
      }

      throw error;
    }
  }

  async revokeSession(
    sessionId: string,
    reason: RevokeReason,
    at: Date,
  ): Promise<void> {
    await this.db.orm.public.Session.where({ id: sessionId })
      .where((session) => session.revokedAt.isNull())
      .updateAndCount({
        revokedAt: toInstant(at),
        revokedReason: varchar(reason, 20),
      });
  }

  async revokeAllSessions(
    userId: number,
    reason: RevokeReason,
    at: Date,
  ): Promise<void> {
    await this.db.orm.public.Session.where({ userId })
      .where((session) => session.revokedAt.isNull())
      .updateAndCount({
        revokedAt: toInstant(at),
        revokedReason: varchar(reason, 20),
      });
  }

  // Os tokens de uma sessão se encadeiam por previousTokenId (FK); a cadeia é
  // desfeita antes de apagar tokens e, por fim, a sessão.
  async deleteSessionsRevokedBefore(
    userId: number,
    before: Date,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const sessions = await tx.orm.public.Session.where({ userId })
        .where((session) => session.revokedAt.lt(toInstant(before)))
        .select('id')
        .all();
      const ids = sessions.map((session) => session.id);

      if (ids.length === 0) {
        return;
      }

      await tx.orm.public.RefreshToken.where((token) =>
        token.sessionId.in(ids),
      ).updateAndCount({ previousTokenId: null });
      await tx.orm.public.RefreshToken.where((token) =>
        token.sessionId.in(ids),
      ).deleteAndCount();
      await tx.orm.public.Session.where((session) =>
        session.id.in(ids),
      ).deleteAndCount();
    });
  }
}
