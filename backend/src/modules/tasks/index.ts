import { Router } from 'express';
import type { Database } from '../../prisma/database';
import { TaskController } from './controller';
import { PrismaTaskRepository } from './repository';
import { TaskRoutes } from './routes';
import { TaskServiceImpl } from './service';

// Superfície pública do módulo: contrato do service e a fábrica.
export type { TaskService } from './service';

export function tasksModule(database: Database): Router {
  const repository = new PrismaTaskRepository(database);
  const service = new TaskServiceImpl(repository);
  const controller = new TaskController(service);

  return new TaskRoutes(controller).register(Router());
}
