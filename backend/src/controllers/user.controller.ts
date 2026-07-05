import type { Request, Response } from 'express';
import {
  createUserService,
  findAllUsersService,
  findUserByIdService,
  updateUserService,
} from '../services/user.service.js';

// Criar novo usuário
export async function createUserController(req: Request, res: Response) {
  const result = await createUserService(req.body);
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
  const result = await updateUserService(req.body, rawId);

  if (!result.ok) {
    if (result.reason == 'not_found') {
      return res.status(404).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  res.status(200).json(result);
}

export async function findAllUsersController(req: Request, res: Response) {
  const result = await findAllUsersService();
  if (!result.ok) {
    return res.status(500).json(result);
  }

  res.status(200).json(result);
}

export async function findUserByIdController(req: Request, res: Response) {
  const { id } = req.params;
  const rawId = Number(id);
  const result = await findUserByIdService(rawId);

  if (!result.ok) {
    return res.status(404).json(result);
  }

  res.status(200).json(result);
}
