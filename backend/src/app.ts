import express from 'express';
import userRouter from './routes/user.route.js';

const app = express();
app.use(express.json());
app.use('/user', userRouter);

app.listen(8000, (error) => {
  if (error) {
    throw error;
  }
  console.log('Servidor rodando na porta 8000');
});
