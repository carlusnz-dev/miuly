import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createBankController,
  deleteBankController,
  findAllBanksByUserIdController,
  findBankByIdController,
  updateBankController,
} from '../controllers/bank.controller.js';

const bankRouter = express.Router();

bankRouter.get('/', authMiddleware, async (req, res) => {
  findAllBanksByUserIdController(req, res);
});

bankRouter.post('/', authMiddleware, async (req, res) => {
  createBankController(req, res);
});

bankRouter.get('/:id', authMiddleware, async (req, res) => {
  findBankByIdController(req, res);
});

bankRouter.delete('/:id', authMiddleware, async (req, res) => {
  deleteBankController(req, res);
});

bankRouter.put('/:id', authMiddleware, async (req, res) => {
  updateBankController(req, res);
});

export default bankRouter;
