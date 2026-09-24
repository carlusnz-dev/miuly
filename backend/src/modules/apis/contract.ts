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

// Conexões com APIs externas cadastradas pelo perfil (modelo `Api`).
// Tokens OAuth não fazem parte deste contrato (ver architecture.md).

export const apiIdParamsSchema = uuidParamsSchema;

const titleSchema = z.string().trim().min(1).max(50);
const descriptionSchema = z.string().trim().max(1000).nullable();
const urlBaseSchema = z.url({ protocol: /^https$/ }).max(100);
const slugUrlSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,30}$/, {
    message: 'Use até 30 letras minúsculas, números ou "-"',
  });

export const createApiBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional(),
    urlBase: urlBaseSchema,
    slugUrl: slugUrlSchema,
    startTime: isoInstantSchema.nullable().optional(),
    endTime: isoInstantSchema.nullable().optional(),
    peoples: peoplesSchema.default([]),
  })
  .refine(endNotBeforeStart, {
    message: TIME_RANGE_MESSAGE,
    path: ['endTime'],
  });

// `status` ativa ou desativa a conexão sem apagá-la.
export const updateApiBodySchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    urlBase: urlBaseSchema.optional(),
    slugUrl: slugUrlSchema.optional(),
    startTime: isoInstantSchema.nullable().optional(),
    endTime: isoInstantSchema.nullable().optional(),
    peoples: peoplesSchema.optional(),
    status: z.boolean().optional(),
  })
  .refine(hasAnyField, { message: ANY_FIELD_MESSAGE })
  .refine(endNotBeforeStart, {
    message: TIME_RANGE_MESSAGE,
    path: ['endTime'],
  });

export const listApisQuerySchema = paginationQuerySchema.extend({
  status: z.stringbool().optional(),
});

export type CreateApiInput = z.output<typeof createApiBodySchema>;
export type UpdateApiInput = z.output<typeof updateApiBodySchema>;
export type ListApisQuery = z.output<typeof listApisQuerySchema>;

export interface ApiConnection {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  urlBase: string;
  slugUrl: string;
  startTime: Date | null;
  endTime: Date | null;
  peoples: string[];
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiConnectionResponse {
  id: string;
  title: string;
  description: string | null;
  urlBase: string;
  slugUrl: string;
  startTime: string | null;
  endTime: string | null;
  peoples: string[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toApiConnectionResponse(
  api: ApiConnection,
): ApiConnectionResponse {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    urlBase: api.urlBase,
    slugUrl: api.slugUrl,
    startTime: api.startTime?.toISOString() ?? null,
    endTime: api.endTime?.toISOString() ?? null,
    peoples: [...api.peoples],
    status: api.status,
    createdAt: api.createdAt.toISOString(),
    updatedAt: api.updatedAt.toISOString(),
  };
}
