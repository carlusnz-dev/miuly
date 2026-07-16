import type { Request, Response } from 'express';
import { createBankSchema } from '../types/bank.type.js';
import {
  createBankService,
  deleteBankService,
  findAllBanksByUserIdService,
  findBankByIdService,
  updateBankService,
} from '../services/bank.service.js';

export async function createBankController(req: Request, res: Response) {
  const parsed = createBankSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(401).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  const rawId = Number(req.userId);
  const result = await createBankService(parsed.data, rawId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}

export async function updateBankController(req: Request, res: Response) {
  const parsed = createBankSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(401).json({
      ok: false,
      reason: 'unaunthorized',
      message: 'Erro na validaçãos dos dados.',
      error: parsed.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const rawId = Number(req.params.id);
  const result = await updateBankService(parsed.data, rawId, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'unauthorized') {
      return res.status(401).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function deleteBankController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const userId = Number(req.userId);
  const result = await deleteBankService(rawId, userId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'unauthorized') {
      return res.status(401).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findBankByIdController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const result = await findBankByIdService(rawId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findAllBanksByUserIdController(
  req: Request,
  res: Response,
) {
  const rawUserId = Number(req.userId);
  const result = await findAllBanksByUserIdService(rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}
