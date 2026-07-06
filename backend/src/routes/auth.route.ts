import express from 'express';
import { loginController } from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/login', loginController);

export default authRouter;
