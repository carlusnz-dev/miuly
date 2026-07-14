import { type Request, type Response } from 'express';
import {
  createFinancesService,
  findAllFinancesByUserIdService,
} from '../services/finances.service.js';
import Logger from '../lib/logger.js';
import { createFinanceSchema } from '../types/finances.type.js';

export async function findAllFinancesByUserIdController(
  req: Request,
  res: Response,
) {
  const id = req.userId;
  const rawId = Number(id);
  const result = await findAllFinancesByUserIdService(rawId);
  Logger.debug('Procurando finanças pelo ID informado: ', rawId);

  if (!result.ok) {
    Logger.error(
      `Erro ao achar finanças pelo ID do usuário: ${result.message}`,
    );
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  Logger.info('Finanças foram achadas com sucesso!');
  res.status(200).json(result);
}

export async function createFinanceController(req: Request, res: Response) {
  const parsed = createFinanceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro ao validar os campos da requisição.',
      error: parsed.error.message,
    });
  }

  const rawId = Number(req.userId);
  const result = await createFinancesService(parsed.data, rawId);

  if (!result.ok) {
    if (result.reason == 'error') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}
