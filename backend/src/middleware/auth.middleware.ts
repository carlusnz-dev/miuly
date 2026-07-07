import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Logger from '../lib/logger.js';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { SESSIONID } = req.cookies || {};

  if (!SESSIONID)
    return res.status(401).json({
      ok: false,
      reason: 'not_found',
      message: 'Usuário não autenticado no sistema.',
    });

  try {
    const payload = jwt.verify(SESSIONID, process.env.JWT_SECRET as string);

    if (typeof payload === 'string' || !payload.id) {
      return res.status(401).json({
        ok: false,
        reason: 'error',
        message: 'Formato payload inválido.',
      });
    }

    req.userId = payload.id;
    return next();
  } catch (e) {
    Logger.error('Erro na verificação do token de login do usuário: ', e);
    return res.status(401).json({
      ok: false,
      reason: 'unaunthorized',
      message: 'Token de login inválido.',
    });
  }
}
