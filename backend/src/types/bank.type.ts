import * as z from 'zod';

const createBankSchema = z.object({
  name: z.string().min(3).max(30),
  balance: z.number().default(0),
});

type CreateBankInput = z.infer<typeof createBankSchema>;

export type { CreateBankInput };
export { createBankSchema };
