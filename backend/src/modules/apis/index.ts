import { Router } from 'express';
import type { Database } from '../../prisma/database';
import { ApiConnectionController } from './controller';
import { PrismaApiConnectionRepository } from './repository';
import { ApiConnectionRoutes } from './routes';
import { ApiConnectionServiceImpl } from './service';

// Superfície pública do módulo: contrato do service e a fábrica.
export type { ApiConnectionService } from './service';

export function apisModule(database: Database): Router {
  const repository = new PrismaApiConnectionRepository(database);
  const service = new ApiConnectionServiceImpl(repository);
  const controller = new ApiConnectionController(service);

  return new ApiConnectionRoutes(controller).register(Router());
}
