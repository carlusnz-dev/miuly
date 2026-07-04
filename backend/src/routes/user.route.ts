import express from 'express';
import { createUserController } from '../controllers/user.controller.js';

const userRouter = express.Router();

// para pegar todos os users, a fazer
// router.get('/');

userRouter.post('/create', async (req, res) => {
  await createUserController(req, res);
});

export default userRouter;
