import { Router, type RequestHandler } from 'express';
import {
  ScryptPasswordHasher,
  type PasswordHasher,
} from '../../core/security/password';
import type { Database } from '../../prisma/database';
import { AuthController } from './controller';
import { requireAuth } from './middleware';
import { PrismaAuthRepository } from './repository';
import { AuthRoutes } from './routes';
import { AuthServiceImpl, type AuthService } from './service';
import { JoseTokenService } from './tokens';

// Superfície pública do módulo: contratos (tipos) e a fábrica. As classes
// concretas não saem daqui.
export type { RevokeReason } from './repository';
export type { AuthService } from './service';
export type { TokenService } from './tokens';

export interface AuthModuleOptions {
  jwtSecret: string;
  secureCookies: boolean;
}

export interface AuthModule {
  router: Router;
  requireAuth: RequestHandler;
  passwords: PasswordHasher;
  // Usado por users para revogar sessões na troca de senha.
  sessions: Pick<AuthService, 'revokeAllSessions'>;
}

export function authModule(
  database: Database,
  options: AuthModuleOptions,
): AuthModule {
  const passwords = new ScryptPasswordHasher();
  const tokens = new JoseTokenService(options.jwtSecret);
  const repository = new PrismaAuthRepository(database);
  const service = new AuthServiceImpl(repository, { passwords, tokens });
  const controller = new AuthController(service, options.secureCookies);
  const guard = requireAuth(tokens);

  return {
    router: new AuthRoutes(controller, guard).register(Router()),
    requireAuth: guard,
    passwords,
    sessions: service,
  };
}
