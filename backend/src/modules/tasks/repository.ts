import { BaseRepository } from '../../core/base';
import { ConflictError } from '../../core/error';
import type { Page, PageRequest } from '../../core/types/pagination';
import type { Database } from '../../prisma/database';
import { isUniqueViolation } from '../../prisma/errors';
import {
  toDate,
  toInstant,
  toNullableDate,
  toNullableInstant,
  type InstantLike,
} from '../../prisma/instant';
import { varchar } from '../../prisma/varchar';
import {
  toTagSlug,
  type CreateTaskInput,
  type Tag,
  type Task,
  type TaskPriority,
  type UpdateTaskInput,
} from './contract';

export interface TaskFilter extends PageRequest {
  done?: boolean;
  priority?: TaskPriority;
  from?: Date;
  to?: Date;
}

// Toda operação recebe o profileId: tarefas de outro perfil não existem.
export interface TaskRepository {
  list(profileId: string, filter: TaskFilter): Promise<Page<Task>>;
  findById(profileId: string, id: string): Promise<Task | null>;
  create(profileId: string, input: CreateTaskInput): Promise<Task>;
  update(
    profileId: string,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Task | null>;
  delete(profileId: string, id: string): Promise<boolean>;
}

// O contrato persiste "Alta" como "urgent"; a API pública usa "high".
type StoredPriority = 'low' | 'medium' | 'urgent' | 'archived';

export function toStoredPriority(priority: TaskPriority): StoredPriority {
  return priority === 'high' ? 'urgent' : priority;
}

export function toTaskPriority(priority: StoredPriority): TaskPriority {
  return priority === 'urgent' ? 'high' : priority;
}

interface TagRow {
  id: number;
  name: string;
  slugUrl: string;
}

interface TaskRow {
  id: string;
  profileId: string;
  title: string;
  observations: string | null;
  done: boolean;
  scheduledAt: InstantLike;
  priority: StoredPriority;
  startTime: InstantLike | null;
  endTime: InstantLike | null;
  peoples: readonly string[];
  status: boolean;
  createdAt: InstantLike;
  updatedAt: InstantLike;
  tags: readonly TagRow[];
}

function toTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, slugUrl: row.slugUrl };
}

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    observations: row.observations,
    done: row.done,
    scheduledAt: toDate(row.scheduledAt),
    priority: toTaskPriority(row.priority),
    startTime: toNullableDate(row.startTime),
    endTime: toNullableDate(row.endTime),
    peoples: [...row.peoples],
    tags: row.tags.map(toTag),
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

// Só inclui as chaves presentes: ausente não altera, null limpa o campo.
function toUpdateData(input: UpdateTaskInput) {
  return {
    ...(input.title !== undefined && { title: varchar(input.title, 50) }),
    ...(input.observations !== undefined && {
      observations: input.observations,
    }),
    ...(input.scheduledAt !== undefined && {
      scheduledAt: toInstant(input.scheduledAt),
    }),
    ...(input.priority !== undefined && {
      priority: toStoredPriority(input.priority),
    }),
    ...(input.done !== undefined && { done: input.done }),
    ...(input.startTime !== undefined && {
      startTime: toNullableInstant(input.startTime) ?? null,
    }),
    ...(input.endTime !== undefined && {
      endTime: toNullableInstant(input.endTime) ?? null,
    }),
    ...(input.peoples !== undefined && { peoples: input.peoples }),
  };
}

type Orm = Database['orm'];

export class PrismaTaskRepository
  extends BaseRepository<Database>
  implements TaskRepository
{
  async list(profileId: string, filter: TaskFilter): Promise<Page<Task>> {
    const scope = () => {
      let tasks = this.db.orm.public.Task.where({ profileId, status: true });

      if (filter.done !== undefined) {
        tasks = tasks.where({ done: filter.done });
      }

      if (filter.priority !== undefined) {
        tasks = tasks.where({ priority: toStoredPriority(filter.priority) });
      }

      if (filter.from !== undefined) {
        const from = toInstant(filter.from);
        tasks = tasks.where((task) => task.scheduledAt.gte(from));
      }

      if (filter.to !== undefined) {
        const to = toInstant(filter.to);
        tasks = tasks.where((task) => task.scheduledAt.lt(to));
      }

      return tasks;
    };

    const [rows, totals] = await Promise.all([
      scope()
        .include('tags')
        .orderBy((task) => task.scheduledAt.asc())
        .limit(filter.pageSize)
        .offset((filter.page - 1) * filter.pageSize)
        .all(),
      scope().aggregate((aggregate) => ({ total: aggregate.count() })),
    ]);

    return {
      items: rows.map(toTask),
      page: filter.page,
      pageSize: filter.pageSize,
      total: Number(totals.total),
    };
  }

  findById(profileId: string, id: string): Promise<Task | null> {
    return this.findOwned(this.db.orm, profileId, id);
  }

  async create(profileId: string, input: CreateTaskInput): Promise<Task> {
    return this.withTagConflict(() =>
      this.db.transaction(async (tx) => {
        const tagIds = await this.resolveTags(tx.orm, profileId, input.tags);
        const row = await tx.orm.public.Task.create({
          profileId,
          title: varchar(input.title, 50),
          observations: input.observations ?? null,
          scheduledAt: toInstant(input.scheduledAt),
          priority: toStoredPriority(input.priority),
          startTime: toNullableInstant(input.startTime) ?? null,
          endTime: toNullableInstant(input.endTime) ?? null,
          peoples: input.peoples,
        });

        await this.linkTags(tx.orm, row.id, tagIds);

        return this.requireOwned(tx.orm, profileId, row.id);
      }),
    );
  }

  async update(
    profileId: string,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Task | null> {
    return this.withTagConflict(() =>
      this.db.transaction(async (tx) => {
        const owned = await this.findOwned(tx.orm, profileId, id);

        if (!owned) {
          return null;
        }

        const data = toUpdateData(input);

        if (Object.keys(data).length > 0) {
          await tx.orm.public.Task.where({ id, profileId }).update(data);
        }

        if (input.tags !== undefined) {
          const tagIds = await this.resolveTags(tx.orm, profileId, input.tags);
          await tx.orm.public.TaskTag.where({ taskId: id }).deleteAndCount();
          await this.linkTags(tx.orm, id, tagIds);
        }

        return this.requireOwned(tx.orm, profileId, id);
      }),
    );
  }

  // Remove a tarefa e seus vínculos com tags; as tags continuam no perfil.
  async delete(profileId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const owned = await tx.orm.public.Task.where({ id, profileId })
        .select('id')
        .first();

      if (!owned) {
        return false;
      }

      await tx.orm.public.TaskTag.where({ taskId: id }).deleteAndCount();
      const deleted = await tx.orm.public.Task.where({
        id,
        profileId,
      }).delete();

      return deleted !== null;
    });
  }

  private async findOwned(
    orm: Orm,
    profileId: string,
    id: string,
  ): Promise<Task | null> {
    const row = await orm.public.Task.where({ id, profileId, status: true })
      .include('tags')
      .first();

    return row ? toTask(row) : null;
  }

  private async requireOwned(
    orm: Orm,
    profileId: string,
    id: string,
  ): Promise<Task> {
    const task = await this.findOwned(orm, profileId, id);

    if (!task) {
      throw new Error(`Tarefa ${id} não encontrada após gravação`);
    }

    return task;
  }

  // Reaproveita tags do perfil pelo slug e cria as que faltam.
  private async resolveTags(
    orm: Orm,
    profileId: string,
    names: readonly string[],
  ): Promise<number[]> {
    if (names.length === 0) {
      return [];
    }

    const wanted = names.map((name) => ({ name, slugUrl: toTagSlug(name) }));
    const slugs = wanted.map((tag) => varchar(tag.slugUrl, 40));
    const existing = await orm.public.Tag.where({ profileId })
      .where((tag) => tag.slugUrl.in(slugs))
      .select('id', 'slugUrl')
      .all();
    const bySlug = new Map<string, number>(
      existing.map((tag) => [tag.slugUrl, tag.id]),
    );
    const missing = wanted.filter((tag) => !bySlug.has(tag.slugUrl));

    if (missing.length > 0) {
      const created = await orm.public.Tag.createAll(
        missing.map((tag) => ({
          profileId,
          name: varchar(tag.name, 30),
          slugUrl: varchar(tag.slugUrl, 40),
        })),
      );

      for (const tag of created) {
        bySlug.set(tag.slugUrl, tag.id);
      }
    }

    return wanted.map((tag) => {
      const id = bySlug.get(tag.slugUrl);

      if (id === undefined) {
        throw new Error(`Tag ${tag.slugUrl} não resolvida`);
      }

      return id;
    });
  }

  private async linkTags(
    orm: Orm,
    taskId: string,
    tagIds: readonly number[],
  ): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    await orm.public.TaskTag.createAndCount(
      tagIds.map((tagId) => ({ taskId, tagId })),
    );
  }

  // Tarefas não têm unicidade própria; uma violação aqui vem de duas
  // requisições criando a mesma tag ao mesmo tempo.
  private async withTagConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Tag criada ao mesmo tempo; tente novamente');
      }

      throw error;
    }
  }
}
