import http from 'http';
import app from './app.js';
import env, { validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import logger from './utils/logger.js';
import { initSocketIO, getIO } from './sockets/index.js';

validateEnv();

const server = http.createServer(app);

initSocketIO(server);

const start = async () => {
  await connectDB();

  server.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    logger.info(`API: http://localhost:${env.port}/api`);
    logger.info(`Socket.IO: ws://localhost:${env.port}`);
  });
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    const socketServer = getIO();
    socketServer.close();
  } catch {
    // Socket.IO not initialized
  }

  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message });
  process.exit(1);
});

start();
