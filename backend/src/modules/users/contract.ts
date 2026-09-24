import * as z from 'zod';
import { ANY_FIELD_MESSAGE, hasAnyField } from '../../core/http/schemas';

// Normaliza antes de validar: " Ana@Example.com " vira "ana@example.com".
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .pipe(z.email());

// O username também é o slug público do perfil (Profile.slugUrl, 30 caracteres).
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, {
    message: 'Use de 3 a 30 letras minúsculas, números ou "_"',
  });

export const passwordSchema = z.string().min(8).max(128);

export const updateUserBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
  })
  .refine(hasAnyField, { message: ANY_FIELD_MESSAGE });

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

// Alterar o username também altera o slug público do perfil.
export const updateProfileBodySchema = z
  .object({
    username: usernameSchema.optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    urlPhoto: z
      .url({ protocol: /^https$/ })
      .max(2048)
      .nullable()
      .optional(),
  })
  .refine(hasAnyField, { message: ANY_FIELD_MESSAGE });

export type UpdateUserInput = z.output<typeof updateUserBodySchema>;
export type ChangePasswordInput = z.output<typeof changePasswordBodySchema>;
export type UpdateProfileInput = z.output<typeof updateProfileBodySchema>;

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: number;
  username: string;
  slugUrl: string;
  bio: string | null;
  urlPhoto: string | null;
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

export interface ProfileResponse {
  id: string;
  username: string;
  slugUrl: string;
  bio: string | null;
  urlPhoto: string | null;
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

export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    id: profile.id,
    username: profile.username,
    slugUrl: profile.slugUrl,
    bio: profile.bio,
    urlPhoto: profile.urlPhoto,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
