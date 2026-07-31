import type { Request, Response } from 'express';
import {
  createTypeSchema,
  typeParamsSchema,
  updateTypeSchema,
} from '../types/types.type.js';
import {
  createTypeService,
  deleteTypeService,
  findAllTypesByUserIdService,
  findTypeByIdService,
  updateTypeService,
} from '../services/types.service.js';

export async function createTypeController(req: Request, res: Response) {
  const parsed = createTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const result = await createTypeService(parsed.data, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'conflict') {
      return res.status(409).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}

export async function updateTypeController(req: Request, res: Response) {
  const parsed = updateTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  const parsedParams = typeParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'ID inválido.',
      error: parsedParams.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const result = await updateTypeService(
    parsedParams.data.id,
    rawUserId,
    parsed.data,
  );

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'conflict') {
      return res.status(409).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function deleteTypeController(req: Request, res: Response) {
  const parsedParams = typeParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'ID inválido.',
      error: parsedParams.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const result = await deleteTypeService(parsedParams.data.id, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'conflict') {
      return res.status(409).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findTypeByIdController(req: Request, res: Response) {
  const parsedParams = typeParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'ID inválido.',
      error: parsedParams.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const result = await findTypeByIdService(parsedParams.data.id, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findAllTypesByUserIdController(
  req: Request,
  res: Response,
) {
  const rawUserId = Number(req.userId);
  const result = await findAllTypesByUserIdService(rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}
