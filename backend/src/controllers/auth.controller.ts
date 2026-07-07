import { type Request, type Response } from 'express';
import { loginUserSchema } from '../types/user.type.js';
import { loginService } from '../services/auth.service.js';
import Logger from '../lib/logger.js';

export async function loginController(req: Request, res: Response) {
  const parsed = loginUserSchema.safeParse(req.body);

  if (!parsed.success) {
    Logger.error('Erro no parse do Zod: ', parsed.error.message);
    return res.status(400).json({
      ok: false,
      reason: 'invalid',
      message: 'Erro ao validar os campos da requisição.',
      error: parsed.error.message,
    });
  }

  const result = await loginService(parsed.data);

  if (!result.ok) {
    if (result.reason == 'unauthorized') {
      return res.status(401).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.cookie('SESSIONID', result.data, {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'strict',
  });

  return res.status(200).json({ ok: true, message: result.message });
}

export async function logoutController(req: Request, res: Response) {
  res.clearCookie('SESSIONID', { httpOnly: true, sameSite: 'strict' });
  return res
    .status(200)
    .json({ ok: true, message: 'Log-out feito com sucesso!' });
}

export async function aboutMeController(req: Request, res: Response) {
  res.status(200).json({
    ok: true,
    message: {
      userId: req.userId,
      info: 'Usuário possui sessão ativa no sistema.',
    },
  });
}
