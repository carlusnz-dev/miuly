import express from 'express';
import userRouter from './routes/user.route.js';
import Logger from './lib/logger.js'; // classe Logger para log
import authRouter from './routes/auth.route.js';

const app = express();
app.use(express.json()); // formato JSON nas requisições
app.use('/user', userRouter); // router para User
app.use('/auth', authRouter);

app.listen(8000, (error) => {
  if (error) {
    throw error;
  }
  Logger.info('Servidor no ar e rodando em http://localhost:8000');
});
