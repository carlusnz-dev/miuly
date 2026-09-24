import type { Request, Response, NextFunction } from 'express';
import * as z from 'zod';
import { ApiError, NotFoundError } from './error';
import { Logger } from './logger';
import type { ErrorResponse } from './types/response';

const logger = new Logger();

// Erros do body-parser (express.json) seguem o formato de http-errors.
interface HttpError extends Error {
  status: number;
  expose: boolean;
  type?: string;
}

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    typeof (error as Partial<HttpError>).status === 'number' &&
    (error as Partial<HttpError>).expose === true
  );
}

function sendError(
  res: Response,
  statusCode: number,
  body: Omit<ErrorResponse, 'ok'>,
): void {
  const response: ErrorResponse = { ok: false, ...body };
  res.status(statusCode).json(response);
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError(`Rota ${req.method} ${req.path} não encontrada`));
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    sendError(res, error.statusCode, { message: error.message });
    return;
  }

  if (error instanceof z.ZodError) {
    sendError(res, 400, {
      message: 'Dados da requisição inválidos',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (isHttpError(error) && error.status >= 400 && error.status < 500) {
    const message =
      error.type === 'entity.parse.failed'
        ? 'JSON malformado no corpo da requisição'
        : error.message;
    sendError(res, error.status, { message });
    return;
  }

  // Detalhes ficam apenas no log; o cliente recebe mensagem genérica.
  logger.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    { method: req.method, path: req.originalUrl, statusCode: 500 },
  );
  sendError(res, 500, { message: 'Erro interno no servidor' });
}
