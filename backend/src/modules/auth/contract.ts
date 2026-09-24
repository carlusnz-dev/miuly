import * as z from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from '../users/contract';

// Estratégia descrita no ADR 0002: access token JWT curto no corpo da resposta,
// refresh token opaco e rotativo em cookie httpOnly.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = 'miuly_refresh';
export const REFRESH_COOKIE_PATH = '/auth';

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

// No login não se aplica a política de senha: qualquer divergência vira 401.
export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.output<typeof registerBodySchema>;
export type LoginInput = z.output<typeof loginBodySchema>;

// Identidade do usuário autenticado, anexada à requisição pelo middleware.
export interface AuthContext {
  userId: number;
  profileId: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile: {
    id: string;
    username: string;
    slugUrl: string;
    urlPhoto: string | null;
  };
}

// Resultado do caso de uso; o refresh token vai para o cookie, nunca para o JSON.
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  profile: {
    id: string;
    username: string;
    slugUrl: string;
    urlPhoto: string | null;
  };
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUserResponse;
}

export function toAuthUserResponse(user: AuthUser): AuthUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: {
      id: user.profile.id,
      username: user.profile.username,
      slugUrl: user.profile.slugUrl,
      urlPhoto: user.profile.urlPhoto,
    },
  };
}

export function toAuthSessionResponse(
  session: AuthSession,
): AuthSessionResponse {
  return {
    accessToken: session.accessToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: toAuthUserResponse(session.user),
  };
}
