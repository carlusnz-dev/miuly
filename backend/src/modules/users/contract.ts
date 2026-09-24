import * as z from 'zod';

const MAX_INT4 = 2_147_483_647;

export const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_INT4),
});

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
