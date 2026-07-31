import * as z from 'zod';
import { Priority } from '../generated/prisma/enums.js';

const createTaskSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(500),
  priority: z.enum(Priority).optional(),
  type_id: z.number(),
  due_date: z.coerce.date(),
  sync: z.boolean().optional(),
});

const updateTaskSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(500),
    priority: z.enum(Priority),
    type_id: z.number(),
    due_date: z.coerce.date(),
    sync: z.boolean(),
  })
  .partial();

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type { CreateTaskInput, UpdateTaskInput };
export { createTaskSchema, updateTaskSchema };
