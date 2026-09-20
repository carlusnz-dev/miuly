import express, { type Express, type RequestHandler } from 'express';
import { Logger } from './core/logger';
import { BadRequestError } from './core/error';
import { errorHandler } from './core/error.middleware';

export interface appDeps {
  enableLogging: boolean;
  debugMode: boolean;
}

export function app({
  enableLogging = false,
  debugMode = false,
}: Partial<appDeps> = {}): Express {
  const app = express();
  app.use(express.json());

  if (enableLogging) {
    const logger = new Logger();
    app.use(logger.expressMiddleware());
  }

  app.get('/health', (_req, res) => {
    return res.send({
      ok: true,
      message: 'teste',
    });
  });

  app.get('/error', (_req, res) => {
    throw new BadRequestError('Este é um teste de erro');
  });

  app.use(errorHandler);

  return app;
}
