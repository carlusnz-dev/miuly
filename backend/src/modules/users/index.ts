import { Router } from 'express';
import { UserController } from './controller';
import type { Database } from '../../prisma/database';
import { PrismaUserRepository } from './repository';
import { UserRoutes } from './routes';
import { UserServiceImpl, type UserServiceDeps } from './service';

// Superfície pública do módulo: contratos (tipos) e a fábrica. As classes
// concretas (UserServiceImpl, PrismaUserRepository) não saem daqui.
export type { SessionRevoker, UserService, UserServiceDeps } from './service';

export function usersModule(database: Database, deps: UserServiceDeps): Router {
  const repository = new PrismaUserRepository(database);
  const service = new UserServiceImpl(repository, deps);
  const controller = new UserController(service);

  return new UserRoutes(controller).register(Router());
}
