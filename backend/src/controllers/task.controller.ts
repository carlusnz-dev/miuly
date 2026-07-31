import { type Request, type Response } from 'express';
import {
  createTaskService,
  deleteTaskService,
  findAllTasksByUserIdService,
  findTaskByIdService,
  updateTaskService,
} from '../services/task.service.js';
import { createTaskSchema, updateTaskSchema } from '../types/task.type.js';

export async function createTaskController(req: Request, res: Response) {
  const parsed = createTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  const rawUserId = Number(req.userId);
  const result = await createTaskService(parsed.data, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(201).json(result);
}

export async function updateTaskController(req: Request, res: Response) {
  const parsed = updateTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'error',
      message: 'Erro na validação dos dados.',
      error: parsed.error.message,
    });
  }

  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await updateTaskService(rawId, rawUserId, parsed.data);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function deleteTaskController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await deleteTaskService(rawId, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findTaskByIdController(req: Request, res: Response) {
  const rawId = Number(req.params.id);
  const rawUserId = Number(req.userId);
  const result = await findTaskByIdService(rawId, rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findAllTasksByUserIdController(
  req: Request,
  res: Response,
) {
  const rawUserId = Number(req.userId);
  const result = await findAllTasksByUserIdService(rawUserId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}
