import { BaseRepository } from '../../core/base';
import type { db } from '../../prisma/db';
import type { User } from './contract';

export type Database = typeof db;

export interface UserRepository {
  findById(id: number): Promise<User | null>;
}

// O codec pg/timestamptz-temporal@1 devolve Temporal.Instant.
interface InstantLike {
  epochMilliseconds: number;
}

function toDate(value: InstantLike): Date {
  return new Date(value.epochMilliseconds);
}

export class PrismaUserRepository
  extends BaseRepository<Database>
  implements UserRepository
{
  async findById(id: number): Promise<User | null> {
    const row = await this.db.orm.public.User.where({ id })
      .select('id', 'name', 'email', 'createdAt', 'updatedAt')
      .first();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt),
    };
  }
}
