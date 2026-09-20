import { app } from './app';
import express from 'express';
import { Logger } from './core/logger';
import { errorHandler } from './core/error.middleware';

const PORT = 8080;
const DEBUG = true;

const server = app({
  enableLogging: true,
  debugMode: DEBUG,
});
const logger = new Logger();

server.listen(PORT, () => {
  logger.info(`Servidor funcionando na porta ${PORT}`);
});
