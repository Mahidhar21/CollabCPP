import logger from '../../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/socketEvents.js';
import { removeParticipant } from '../utils/participantStore.js';
import { registerRoomSocketHandlers } from '../roomSocket.js';
import { registerEditorSocketHandlers, handleEditorDisconnect } from './editorSocket.js';
import { registerExecutionSocketHandlers } from './executionSocket.js';
import { registerChatSocketHandlers } from './chatSocket.js';
import { registerPresenceSocketHandlers } from './presenceSocket.js';
import { registerWhiteboardSocketHandlers } from './whiteboardSocket.js';
import { registerSessionSocketHandlers, clearSessionDebounceTimers } from './sessionSocket.js';

/**
 * Registers global connection lifecycle handlers on a single socket.
 * Room-specific handlers are delegated to roomSocket.js.
 */
export function registerConnectionHandlers(io, socket) {
  logger.info('Socket connected', {
    socketId: socket.id,
    userId: socket.user.id,
    username: socket.user.username,
  });

  socket.emit(SOCKET_EVENTS.CONNECTION_ACK, {
    socketId: socket.id,
    user: {
      id: socket.user.id,
      username: socket.user.username,
    },
  });

  registerRoomSocketHandlers(io, socket);
  registerEditorSocketHandlers(io, socket);
  registerExecutionSocketHandlers(io, socket);
  registerChatSocketHandlers(io, socket);
  registerPresenceSocketHandlers(io, socket);
  registerWhiteboardSocketHandlers(io, socket);
  registerSessionSocketHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    const meta = removeParticipant(socket.id);

    if (meta) {
      const roomChannel = meta.roomId;
      
      // Clear debounce timers to prevent pending saves after disconnect
      clearSessionDebounceTimers(meta.roomId);
      
      socket.to(roomChannel).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
        roomId: meta.roomId,
        participant: {
          socketId: socket.id,
          userId: meta.userId,
          username: meta.username,
        },
      });
      handleEditorDisconnect(io, socket, meta);
    }

    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: socket.user?.id,
      reason,
      roomId: meta?.roomId ?? null,
    });
  });
}
