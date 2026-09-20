import type { Request, Response, NextFunction } from 'express';
import {
  ApiError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from './error';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    if (error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
      return;
    }
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        ok: false,
        message: error.message,
      });
      return;
    }
  }

  res.status(500).json({
    ok: false,
    message: 'Erro interno no servidor',
    cause: error.cause,
  });
}
