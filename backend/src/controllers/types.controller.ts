import type { Request, Response } from 'express';
import { createTypeSchema } from '../types/types.type.js';
import {
  createTypeService,
  findTypeByIdService,
} from '../services/types.service.js';

export async function createTypeController(req: Request, res: Response) {
  const parsed = createTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'unauthorized',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    };
  }

  const rawUserId = Number(req.userId);
  const result = await createTypeService(parsed.data, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}

export async function findTypeByIdController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await findTypeByIdService(rawId, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}
