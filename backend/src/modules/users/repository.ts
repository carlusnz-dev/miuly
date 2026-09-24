import { BaseRepository } from '../../core/base';
import { ConflictError } from '../../core/error';
import type { Database } from '../../prisma/database';
import { isUniqueViolation } from '../../prisma/errors';
import { toDate, type InstantLike } from '../../prisma/instant';
import { varchar } from '../../prisma/varchar';
import type { Profile, User } from './contract';

export interface ProfileChanges {
  username?: string;
  slugUrl?: string;
  bio?: string | null;
  urlPhoto?: string | null;
}

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  updateName(id: number, name: string): Promise<User | null>;
  findPasswordHash(id: number): Promise<string | null>;
  updatePasswordHash(id: number, hashPassword: string): Promise<void>;
  findProfileByUserId(userId: number): Promise<Profile | null>;
  updateProfile(
    userId: number,
    changes: ProfileChanges,
  ): Promise<Profile | null>;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  createdAt: InstantLike;
  updatedAt: InstantLike;
}

interface ProfileRow {
  id: string;
  userId: number;
  username: string;
  slugUrl: string;
  bio: string | null;
  urlPhoto: string | null;
  createdAt: InstantLike;
  updatedAt: InstantLike;
}

// Mapeamento explícito: hashPassword e demais colunas nunca saem do adaptador.
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    slugUrl: row.slugUrl,
    bio: row.bio,
    urlPhoto: row.urlPhoto,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

// Só inclui as chaves presentes: ausente não altera, null limpa o campo.
function toProfileUpdate(changes: ProfileChanges) {
  return {
    ...(changes.username !== undefined && {
      username: varchar(changes.username, 100),
    }),
    ...(changes.slugUrl !== undefined && {
      slugUrl: varchar(changes.slugUrl, 30),
    }),
    ...(changes.bio !== undefined && { bio: changes.bio }),
    ...(changes.urlPhoto !== undefined && { urlPhoto: changes.urlPhoto }),
  };
}

export class PrismaUserRepository
  extends BaseRepository<Database>
  implements UserRepository
{
  async findById(id: number): Promise<User | null> {
    const row = await this.db.orm.public.User.where({ id })
      .select('id', 'name', 'email', 'createdAt', 'updatedAt')
      .first();

    return row ? toUser(row) : null;
  }

  async updateName(id: number, name: string): Promise<User | null> {
    const row = await this.db.orm.public.User.where({ id }).update({
      name: varchar(name, 255),
    });

    return row ? toUser(row) : null;
  }

  async findPasswordHash(id: number): Promise<string | null> {
    const row = await this.db.orm.public.User.where({ id })
      .select('hashPassword')
      .first();

    return row?.hashPassword ?? null;
  }

  async updatePasswordHash(id: number, hashPassword: string): Promise<void> {
    await this.db.orm.public.User.where({ id }).update({
      hashPassword: varchar(hashPassword, 255),
    });
  }

  async findProfileByUserId(userId: number): Promise<Profile | null> {
    const row = await this.db.orm.public.Profile.where({ userId }).first();

    return row ? toProfile(row) : null;
  }

  async updateProfile(
    userId: number,
    changes: ProfileChanges,
  ): Promise<Profile | null> {
    try {
      const row = await this.db.orm.public.Profile.where({ userId }).update(
        toProfileUpdate(changes),
      );

      return row ? toProfile(row) : null;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Username já está em uso');
      }

      throw error;
    }
  }
}
