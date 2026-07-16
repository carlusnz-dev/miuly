import express from 'express';
import {
  createUserController,
  deleteUserController,
  findAllUsersController,
  findUserByIdController,
  updateUserController,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const userRouter = express.Router();

// para pegar todos os users, a fazer
// router.get('/');

userRouter.get('', authMiddleware, async (req, res) => {
  await findAllUsersController(req, res);
});

userRouter.post('/', authMiddleware, async (req, res) => {
  await createUserController(req, res);
});

userRouter.get('/:id', authMiddleware, async (req, res) => {
  await findUserByIdController(req, res);
});

userRouter.put('/:id', authMiddleware, async (req, res) => {
  await updateUserController(req, res);
});

userRouter.delete('/:id', authMiddleware, async (req, res) => {
  await deleteUserController(req, res);
});

export default userRouter;
