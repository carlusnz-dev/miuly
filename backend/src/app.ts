import express, { type Express } from 'express';
import './core/zod';
import { Logger } from './core/logger';
import { BadRequestError } from './core/error';
import { errorHandler, notFoundHandler } from './core/error.middleware';
import type { SuccessResponse } from './core/types/response';
import { apisModule } from './modules/apis';
import { authModule, type AuthModuleOptions } from './modules/auth';
import { tasksModule } from './modules/tasks';
import { usersModule } from './modules/users';
import type { Database } from './prisma/database';

export interface appDeps {
  database: Database;
  auth: AuthModuleOptions;
  enableLogging?: boolean;
  debugMode?: boolean;
}

export function app({
  database,
  auth: authOptions,
  enableLogging = false,
  debugMode = false,
}: appDeps): Express {
  const app = express();
  app.use(express.json());

  if (enableLogging) {
    const logger = new Logger();
    app.use(logger.expressMiddleware());
  }

  app.get('/health', (_req, res) => {
    const response: SuccessResponse<{ status: 'up' }> = {
      ok: true,
      message: 'Serviço disponível',
      data: { status: 'up' },
    };
    res.json(response);
  });

  if (debugMode) {
    app.get('/error', () => {
      throw new BadRequestError('Este é um teste de erro');
    });
  }

  const auth = authModule(database, authOptions);
  app.use('/auth', auth.router);
  app.use(
    '/users',
    auth.requireAuth,
    usersModule(database, {
      passwords: auth.passwords,
      sessions: auth.sessions,
    }),
  );

  app.use('/tasks', auth.requireAuth, tasksModule(database));
  app.use('/apis', auth.requireAuth, apisModule(database));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
