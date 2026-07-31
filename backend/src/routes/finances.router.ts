import express from 'express';
import {
  createFinanceController,
  deleteFinanceController,
  findAllFinancesByUserIdController,
  updateFinanceController,
} from '../controllers/finances.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const financesRouter = express.Router();

// rotas das finanças
financesRouter.get('/', authMiddleware, async (req, res) => {
  findAllFinancesByUserIdController(req, res);
});

financesRouter.post('/', authMiddleware, async (req, res) => {
  createFinanceController(req, res);
});

financesRouter.put('/:id', authMiddleware, async (req, res) => {
  updateFinanceController(req, res);
});

financesRouter.delete('/:id', authMiddleware, async (req, res) => {
  deleteFinanceController(req, res);
});

export default financesRouter;
