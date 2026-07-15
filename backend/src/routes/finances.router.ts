import express from 'express';
import {
  createFinanceController,
  findAllFinancesByUserIdController,
} from '../controllers/finances.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const financesRouter = express.Router();

// rotas das finanças
financesRouter.get('/all', authMiddleware, async (req, res) => {
  findAllFinancesByUserIdController(req, res);
});

financesRouter.post('/create', authMiddleware, async (req, res) => {
  createFinanceController(req, res);
});

export default financesRouter;
