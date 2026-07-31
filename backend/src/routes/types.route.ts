import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createTypeController,
  deleteTypeController,
  findAllTypesByUserIdController,
  findTypeByIdController,
  updateTypeController,
} from '../controllers/types.controller.js';

const typesRouter = express.Router();

typesRouter.get('/', authMiddleware, async (req, res) => {
  findAllTypesByUserIdController(req, res);
});

typesRouter.post('/', authMiddleware, async (req, res) => {
  createTypeController(req, res);
});

typesRouter.get('/:id', authMiddleware, async (req, res) => {
  findTypeByIdController(req, res);
});

typesRouter.put('/:id', authMiddleware, async (req, res) => {
  updateTypeController(req, res);
});

typesRouter.delete('/:id', authMiddleware, async (req, res) => {
  deleteTypeController(req, res);
});

export default typesRouter;
