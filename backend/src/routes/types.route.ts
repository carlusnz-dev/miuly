import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createTypeController,
  findTypeByIdController,
} from '../controllers/types.controller.js';

const typesRouter = express.Router();

// routes
// typesRouter.get('/', authMiddleware)
typesRouter.post('/', authMiddleware, async (req, res) => {
  createTypeController(req, res);
});

typesRouter.get('/:id', authMiddleware, async (req, res) => {
  findTypeByIdController(req, res);
});

export default typesRouter;
