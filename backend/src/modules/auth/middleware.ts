import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../core/error';
import type { TokenService } from './tokens';

const BEARER = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/;

// Valida `Authorization: Bearer <token>` e grava o AuthContext em
// res.locals.auth, lido pelo handler das rotas com `auth: true`.
export function requireAuth(tokens: TokenService): RequestHandler {
  return async (req, res, next) => {
    const match = BEARER.exec(req.headers.authorization ?? '');

    if (!match?.[1]) {
      throw new UnauthorizedError('Autenticação necessária');
    }

    const auth = await tokens.verifyAccessToken(match[1]);

    if (!auth) {
      throw new UnauthorizedError('Token inválido ou expirado');
    }

    res.locals['auth'] = auth;
    next();
  };
}
