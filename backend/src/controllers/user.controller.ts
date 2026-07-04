import type { Request, Response } from 'express';
import { createUserService } from '../services/user.service.js';

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
