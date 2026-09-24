import * as z from 'zod';
import { paginationQuerySchema } from '../../core/http/pagination';
import {
  ANY_FIELD_MESSAGE,
  endNotBeforeStart,
  hasAnyField,
  isoInstantSchema,
  peoplesSchema,
  TIME_RANGE_MESSAGE,
  uuidParamsSchema,
} from '../../core/http/schemas';

// Valores públicos da API. O adaptador Prisma traduz para o enum `Priority`
// do contrato (`High` é persistido como "urgent").
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'archived'] as const;

export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export type TaskPriority = z.output<typeof taskPrioritySchema>;

export const taskIdParamsSchema = uuidParamsSchema;

const titleSchema = z.string().trim().min(1).max(50);
const observationsSchema = z.string().trim().max(2000).nullable();

export const createTaskBodySchema = z
  .object({
    title: titleSchema,
    observations: observationsSchema.optional(),
    scheduledAt: isoInstantSchema,
    priority: taskPrioritySchema.default('medium'),
    startTime: isoInstantSchema.nullable().optional(),
    endTime: isoInstantSchema.nullable().optional(),
    peoples: peoplesSchema.default([]),
  })
  .refine(endNotBeforeStart, {
    message: TIME_RANGE_MESSAGE,
    path: ['endTime'],
  });

export const updateTaskBodySchema = z
  .object({
    title: titleSchema.optional(),
    observations: observationsSchema.optional(),
    scheduledAt: isoInstantSchema.optional(),
    priority: taskPrioritySchema.optional(),
    done: z.boolean().optional(),
    startTime: isoInstantSchema.nullable().optional(),
    endTime: isoInstantSchema.nullable().optional(),
    peoples: peoplesSchema.optional(),
  })
  .refine(hasAnyField, { message: ANY_FIELD_MESSAGE })
  .refine(endNotBeforeStart, {
    message: TIME_RANGE_MESSAGE,
    path: ['endTime'],
  });

// Filtros opcionais sobre `scheduledAt`; `from` inclusivo e `to` exclusivo.
export const listTasksQuerySchema = paginationQuerySchema
  .extend({
    done: z.stringbool().optional(),
    priority: taskPrioritySchema.optional(),
    from: isoInstantSchema.optional(),
    to: isoInstantSchema.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from < query.to, {
    message: '"from" deve ser anterior a "to"',
    path: ['to'],
  });

export type CreateTaskInput = z.output<typeof createTaskBodySchema>;
export type UpdateTaskInput = z.output<typeof updateTaskBodySchema>;
export type ListTasksQuery = z.output<typeof listTasksQuerySchema>;

// `status` não é exposto no corte 1: listagens só consideram `status = true`.
export interface Task {
  id: string;
  profileId: string;
  title: string;
  observations: string | null;
  done: boolean;
  scheduledAt: Date;
  priority: TaskPriority;
  startTime: Date | null;
  endTime: Date | null;
  peoples: string[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskResponse {
  id: string;
  title: string;
  observations: string | null;
  done: boolean;
  scheduledAt: string;
  priority: TaskPriority;
  startTime: string | null;
  endTime: string | null;
  peoples: string[];
  createdAt: string;
  updatedAt: string;
}

export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    observations: task.observations,
    done: task.done,
    scheduledAt: task.scheduledAt.toISOString(),
    priority: task.priority,
    startTime: task.startTime?.toISOString() ?? null,
    endTime: task.endTime?.toISOString() ?? null,
    peoples: [...task.peoples],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
