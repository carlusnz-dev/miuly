import * as z from 'zod';
import { AppliesTo } from '../generated/prisma/enums.js';

const createTypeSchema = z.object({
  name: z.string().min(3).max(30),
  applies_to: z
    .enum(AppliesTo)
    .array()
    .min(1, 'O tipo tem que ter pelo menos uma classe.'),
});

const updateTypeSchema = z
  .object({
    name: z.string().min(3).max(30),
    applies_to: z
      .enum(AppliesTo)
      .array()
      .min(1, 'O tipo tem que ter pelo menos uma classe.'),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar.',
  });

const typeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type CreateTypeInput = z.infer<typeof createTypeSchema>;
type UpdateTypeInput = z.infer<typeof updateTypeSchema>;

export type { CreateTypeInput, UpdateTypeInput };
export { createTypeSchema, updateTypeSchema, typeParamsSchema };
