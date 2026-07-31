import { type Request, type Response } from 'express';
import {
  createFinancesService,
  deleteFinanceService,
  findAllFinancesByUserIdService,
  updateFinanceService,
} from '../services/finances.service.js';
import Logger from '../lib/logger.js';
import {
  createFinanceSchema,
  updateFinanceSchema,
} from '../types/finances.type.js';

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
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}

export async function updateFinanceController(req: Request, res: Response) {
  const parsed = updateFinanceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  // id e userId
  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await updateFinanceService(rawId, rawUserId, parsed.data);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function deleteFinanceController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await deleteFinanceService(rawId, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}
