import express from 'express';
import {
  aboutMeController,
  loginController,
  logoutController,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const authRouter = express.Router();

authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.get('/me', authMiddleware, aboutMeController);

export default authRouter;
