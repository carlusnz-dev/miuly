import * as z from 'zod';

const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: z.string().min(8),
});

const updateUserSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.email(),
  })
  .partial();

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export { createUserSchema, updateUserSchema };
export type { CreateUserInput, UpdateUserInput };
