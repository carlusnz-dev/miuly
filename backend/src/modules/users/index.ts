import { Router } from 'express';
import { UserController } from './controller';
import { PrismaUserRepository, type Database } from './repository';
import { UserRoutes } from './routes';
import { UserService } from './service';

export function usersModule(database: Database): Router {
  const repository = new PrismaUserRepository(database);
  const service = new UserService(repository);
  const controller = new UserController(service);

  return new UserRoutes(controller).register(Router());
}
