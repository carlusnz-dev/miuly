import * as z from 'zod';

const createFinanceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(30),
  value: z.number(),
  type_id: z.number(),
  bank_id: z.number(),
});

type CreateFinanceInput = z.infer<typeof createFinanceSchema>;

export type { CreateFinanceInput };
export { createFinanceSchema };
