import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createBankController,
  deleteBankController,
  findBankByIdController,
} from '../controllers/bank.controller.js';

const bankRouter = express.Router();

bankRouter.get('/:id', authMiddleware, async (req, res) => {
  findBankByIdController(req, res);
});

bankRouter.post('/create', authMiddleware, async (req, res) => {
  createBankController(req, res);
});

bankRouter.post('/delete/:id', authMiddleware, async (req, res) => {
  deleteBankController(req, res);
});

export default bankRouter;
