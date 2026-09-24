import type { db } from './db';

// Tipo do cliente Prisma recebido pelos adaptadores. É só tipo: importar daqui
// não abre conexão nem lê variáveis de ambiente.
export type Database = typeof db;
