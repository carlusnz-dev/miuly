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

const loginUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.email().optional(),
  password: z.string().min(8),
});

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;
type LoginUserInput = z.infer<typeof loginUserSchema>;

export { createUserSchema, updateUserSchema, loginUserSchema };
export type { CreateUserInput, UpdateUserInput, LoginUserInput };
