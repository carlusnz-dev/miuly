import express from 'express';
import {
  createUserController,
  findAllUsersController,
  findUserByIdController,
} from '../controllers/user.controller.js';

const userRouter = express.Router();

// para pegar todos os users, a fazer
// router.get('/');

userRouter.post('/create', async (req, res) => {
  await createUserController(req, res);
});

userRouter.get('/all', async (req, res) => {
  await findAllUsersController(req, res);
});

userRouter.get('/:id', async (req, res) => {
  await findUserByIdController(req, res);
});

export default userRouter;
