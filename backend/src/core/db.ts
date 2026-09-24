import { db } from '../prisma/db';
import { Logger } from './logger';

const logger = new Logger();

export async function connectDatabase(): Promise<void> {
  try {
    await db.connect();
    logger.info('Conexão com o banco foi estabelecida');
  } catch (error) {
    logger.error('Não foi possível conectar ao banco');
    throw error;
  }
}
