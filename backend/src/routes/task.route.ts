import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createTaskController,
  deleteTaskController,
  findAllTasksByUserIdController,
  findTaskByIdController,
  updateTaskController,
} from '../controllers/task.controller.js';

const taskRouter = express.Router();

taskRouter.get('/', authMiddleware, async (req, res) => {
  findAllTasksByUserIdController(req, res);
});

taskRouter.post('/', authMiddleware, async (req, res) => {
  createTaskController(req, res);
});

taskRouter.get('/:id', authMiddleware, async (req, res) => {
  findTaskByIdController(req, res);
});

taskRouter.put('/:id', authMiddleware, async (req, res) => {
  updateTaskController(req, res);
});

taskRouter.delete('/:id', authMiddleware, async (req, res) => {
  deleteTaskController(req, res);
});

export default taskRouter;
