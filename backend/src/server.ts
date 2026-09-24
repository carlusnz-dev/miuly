import { app } from './app';
import { env } from './core/env';
import { Logger } from './core/logger';
import { connectDatabase } from './core/db';
import { db } from './prisma/db';

const server = app({
  database: db,
  auth: {
    jwtSecret: env.JWT_SECRET,
    secureCookies: env.NODE_ENV === 'production',
  },
  enableLogging: true,
  debugMode: env.NODE_ENV === 'development',
});

const logger = new Logger();

await connectDatabase();

server.listen(env.PORT, () => {
  logger.info(`Servidor funcionando na porta ${env.PORT}`);
});
