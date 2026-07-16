import { type Request, type Response } from 'express';
import {
  createUserService,
  deleteUserService,
  findAllUsersService,
  findUserByIdService,
  updateUserService,
} from '../services/user.service.js';
import { createUserSchema, updateUserSchema } from '../types/user.type.js';

// types Zod para parse no objeto do req.body
// type CreateUserInput = z.infer<typeof createUserSchema>;

// Criar novo usuário
export async function createUserController(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'invalid',
      message: 'Erro ao validar os campos da requisição.',
      error: parsed.error.message,
    });
  }

  const result = await createUserService(parsed.data);
  if (!result.ok) {
    if (result.reason == 'error') {
      return res.status(500).json(result);
    } else {
      return res.status(409).json(result);
    }
  }

  res.status(201).json(result);
}

export async function updateUserController(req: Request, res: Response) {
  const { id } = req.params;
  const rawId = Number(id);

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: 'invalid',
      message: `Erro ao validar os campos da requisição.`,
      error: parsed.error.message,
    });
  }

  const result = await updateUserService(parsed.data, rawId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(409).json(result);
    }
  }

  res.status(200).json(result);
}

export async function deleteUserController(req: Request, res: Response) {
  const { id } = req.params;
  const rawId = Number(id);
  const result = await deleteUserService(rawId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else if (result.reason == 'conflict') {
      return res.status(401).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  return res.status(200).json(result);
}

export async function findAllUsersController(req: Request, res: Response) {
  const result = await findAllUsersService(Number(req.userId));
  if (!result.ok) {
    return res.status(500).json(result);
  }

  res.status(200).json(result);
}

export async function findUserByIdController(req: Request, res: Response) {
  const { id } = req.params;
  const rawId = Number(id);
  const rawIdUserLoged = Number(req.userId);
  const result = await findUserByIdService(rawId, rawIdUserLoged);

  if (!result.ok) {
    return res.status(404).json(result);
  }

  res.status(200).json(result);
}
