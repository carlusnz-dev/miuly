import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.route.js';
import Logger from './lib/logger.js'; // classe Logger para log
import authRouter from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import financesRouter from './routes/finances.router.js';
import bankRouter from './routes/bank.route.js';
import typesRouter from './routes/types.route.js';
import taskRouter from './routes/task.route.js';

const app = express();
app.use(express.json()); // formato JSON nas requisições
app.use(cookieParser()); // cookie-parser para leitura dos cookies
// CORS Aplicado para aceitar req. do front-end
app.use(
  cors({
    origin: ['http://localhost:4200'],
    credentials: true,
  }),
);

app.use('/user', userRouter); // router para User
app.use('/auth', authRouter); // router para autenticação
app.use('/finances', financesRouter); // router para finanças
app.use('/bank', bankRouter); // router para banco
app.use('/type', typesRouter); // router para tipos
app.use('/task', taskRouter); // router para tarefas

app.listen(8000, (error) => {
  if (error) {
    throw error;
  }
  Logger.info('Servidor no ar e rodando em http://localhost:8000');
});
