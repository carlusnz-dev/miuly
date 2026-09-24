import { app } from './app';
import { env } from './core/env';
import { Logger } from './core/logger';
import { connectDatabase } from './core/db';
import { db } from './prisma/db';

const server = app({
  database: db,
  enableLogging: true,
  debugMode: env.NODE_ENV === 'development',
});

const logger = new Logger();

await connectDatabase();

server.listen(env.PORT, () => {
  logger.info(`Servidor funcionando na porta ${env.PORT}`);
});
