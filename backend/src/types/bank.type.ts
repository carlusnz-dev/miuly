import * as z from 'zod';

const createBankSchema = z.object({
  name: z.string().min(3).max(30),
  balance: z.number().default(0),
});

const updateBankSchema = z
  .object({
    name: z.string().min(3).max(3),
    balance: z.number(),
  })
  .partial();

type CreateBankInput = z.infer<typeof createBankSchema>;
type UpdateBankInput = z.infer<typeof updateBankSchema>;

export type { CreateBankInput, UpdateBankInput };
export { createBankSchema, updateBankSchema };
