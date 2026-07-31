import * as z from 'zod';

const createFinanceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(30),
  value: z.number(),
  type_id: z.number(),
  bank_id: z.number(),
});

const updateFinanceSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(30),
    value: z.number(),
    type_id: z.number(),
    bank_id: z.number(),
  })
  .partial();

type CreateFinanceInput = z.infer<typeof createFinanceSchema>;
type UpdateFinanceInput = z.infer<typeof updateFinanceSchema>;

export type { CreateFinanceInput, UpdateFinanceInput };
export { createFinanceSchema, updateFinanceSchema };
