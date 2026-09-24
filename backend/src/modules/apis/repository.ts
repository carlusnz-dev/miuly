import { BaseRepository } from '../../core/base';
import { ConflictError } from '../../core/error';
import type { Page, PageRequest } from '../../core/types/pagination';
import type { Database } from '../../prisma/database';
import { isUniqueViolation } from '../../prisma/errors';
import {
  toDate,
  toNullableDate,
  toNullableInstant,
  type InstantLike,
} from '../../prisma/instant';
import { varchar } from '../../prisma/varchar';
import type { ApiConnection, CreateApiInput, UpdateApiInput } from './contract';

export interface ApiConnectionFilter extends PageRequest {
  status?: boolean;
}

// Toda operação recebe o profileId: conexões de outro perfil não existem.
export interface ApiConnectionRepository {
  list(
    profileId: string,
    filter: ApiConnectionFilter,
  ): Promise<Page<ApiConnection>>;
  findById(profileId: string, id: string): Promise<ApiConnection | null>;
  create(profileId: string, input: CreateApiInput): Promise<ApiConnection>;
  update(
    profileId: string,
    id: string,
    input: UpdateApiInput,
  ): Promise<ApiConnection | null>;
  delete(profileId: string, id: string): Promise<boolean>;
}

interface ApiRow {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  urlBase: string;
  slugUrl: string;
  startTime: InstantLike | null;
  endTime: InstantLike | null;
  peoples: readonly string[];
  status: boolean;
  createdAt: InstantLike;
  updatedAt: InstantLike;
}

export function toApiConnection(row: ApiRow): ApiConnection {
  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    description: row.description,
    urlBase: row.urlBase,
    slugUrl: row.slugUrl,
    startTime: toNullableDate(row.startTime),
    endTime: toNullableDate(row.endTime),
    peoples: [...row.peoples],
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

const TITLE_CONFLICT = 'Já existe uma conexão com este título';

function translateConflict(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw new ConflictError(TITLE_CONFLICT);
  }

  throw error;
}

// Só inclui as chaves presentes: ausente não altera, null limpa o campo.
function toUpdateData(input: UpdateApiInput) {
  return {
    ...(input.title !== undefined && { title: varchar(input.title, 50) }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.urlBase !== undefined && {
      urlBase: varchar(input.urlBase, 100),
    }),
    ...(input.slugUrl !== undefined && { slugUrl: varchar(input.slugUrl, 30) }),
    ...(input.startTime !== undefined && {
      startTime: toNullableInstant(input.startTime) ?? null,
    }),
    ...(input.endTime !== undefined && {
      endTime: toNullableInstant(input.endTime) ?? null,
    }),
    ...(input.peoples !== undefined && { peoples: input.peoples }),
    ...(input.status !== undefined && { status: input.status }),
  };
}

export class PrismaApiConnectionRepository
  extends BaseRepository<Database>
  implements ApiConnectionRepository
{
  async list(
    profileId: string,
    filter: ApiConnectionFilter,
  ): Promise<Page<ApiConnection>> {
    const scope = () => {
      const base = this.db.orm.public.Api.where({ profileId });

      return filter.status === undefined
        ? base
        : base.where({ status: filter.status });
    };

    const [rows, totals] = await Promise.all([
      scope()
        .orderBy((api) => api.createdAt.desc())
        .limit(filter.pageSize)
        .offset((filter.page - 1) * filter.pageSize)
        .all(),
      scope().aggregate((aggregate) => ({ total: aggregate.count() })),
    ]);

    return {
      items: rows.map(toApiConnection),
      page: filter.page,
      pageSize: filter.pageSize,
      total: Number(totals.total),
    };
  }

  async findById(profileId: string, id: string): Promise<ApiConnection | null> {
    const row = await this.db.orm.public.Api.where({ id, profileId }).first();

    return row ? toApiConnection(row) : null;
  }

  async create(
    profileId: string,
    input: CreateApiInput,
  ): Promise<ApiConnection> {
    try {
      const row = await this.db.orm.public.Api.create({
        profileId,
        title: varchar(input.title, 50),
        description: input.description ?? null,
        urlBase: varchar(input.urlBase, 100),
        slugUrl: varchar(input.slugUrl, 30),
        startTime: toNullableInstant(input.startTime) ?? null,
        endTime: toNullableInstant(input.endTime) ?? null,
        peoples: input.peoples,
      });

      return toApiConnection(row);
    } catch (error) {
      return translateConflict(error);
    }
  }

  async update(
    profileId: string,
    id: string,
    input: UpdateApiInput,
  ): Promise<ApiConnection | null> {
    try {
      const row = await this.db.orm.public.Api.where({ id, profileId }).update(
        toUpdateData(input),
      );

      return row ? toApiConnection(row) : null;
    } catch (error) {
      return translateConflict(error);
    }
  }

  async delete(profileId: string, id: string): Promise<boolean> {
    const row = await this.db.orm.public.Api.where({ id, profileId }).delete();

    return row !== null;
  }
}
