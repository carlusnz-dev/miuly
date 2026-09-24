import express, { type Express } from 'express';
import './core/zod';
import { Logger } from './core/logger';
import { BadRequestError } from './core/error';
import { errorHandler, notFoundHandler } from './core/error.middleware';
import type { SuccessResponse } from './core/types/response';
import type { Database } from './prisma/database';

export interface appDeps {
  database: Database;
  enableLogging?: boolean;
  debugMode?: boolean;
}

export function app({
  database,
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
