import { Server } from 'socket.io';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { authenticateSocket } from './utils/socketAuth.js';
import { registerConnectionHandlers } from './handlers/connectionHandler.js';

let io = null;

/**
 * Initializes Socket.IO on the shared HTTP server.
 * Architecture: single default namespace; room channels via socket.join(roomId).
 * Future: editor/chat/cursor handlers register alongside roomSocket.js.
 */
export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    registerConnectionHandlers(io, socket);
  });

  logger.info('Socket.IO initialized', { corsOrigin: env.clientUrl });
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

export default { initSocketIO, getIO };
