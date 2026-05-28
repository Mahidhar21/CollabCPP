/**
 * Code Execution Socket Handler
 * Manages execute_code events and broadcasts results to room
 */

import { executeCode } from '../../services/codeExecution/index.js';
import logger from '../../utils/logger.js';
import { getParticipantRoom } from '../utils/participantStore.js';

export function registerExecutionSocketHandlers(io, socket) {
  /**
   * Handle code execution request from client
   * Event: execute_code
   * Body: { roomId, code }
   */
  socket.on('execute_code', async (data, ack) => {
    try {
      const { roomId, code } = data || {};

      if (!roomId || !code) {
        logger.warn(`[Execution] Invalid execute_code data from ${socket.id}`);
        if (typeof ack === 'function') {
          ack({ success: false, message: 'Missing roomId or code' });
        }
        return;
      }

      // Verify room membership
      const room = getParticipantRoom(socket.id);
      if (!room || room !== roomId) {
        logger.warn(`[Execution] Unauthorized execution attempt from ${socket.id}`);
        if (typeof ack === 'function') {
          ack({ success: false, message: 'Not in room' });
        }
        return;
      }

      logger.info(`[Execution] User ${socket.user?.username || 'unknown'} executing code in room ${roomId}`);

      // Execute code
      const result = await executeCode(code, {
        compileTimeout: 10000,
        runtimeTimeout: 30000,
      });

      // Broadcast result to room
      io.to(roomId).emit('execution:output', {
        roomId,
        executedBy: {
          userId: socket.user.id,
          username: socket.user.username,
          socketId: socket.id,
        },
        result,
        timestamp: new Date().toISOString(),
      });

      // Acknowledge to sender
      if (typeof ack === 'function') {
        ack({ success: true });
      }

      logger.info(`[Execution] Result broadcasted to room ${roomId}`);
    } catch (error) {
      logger.error(`[Execution] Error in execute_code handler: ${error.message}`);
      if (typeof ack === 'function') {
        ack({ success: false, message: error.message });
      }
    }
  });

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    // Execution handler doesn't maintain state, so minimal cleanup needed
    logger.debug(`[Execution] Cleanup for disconnected socket ${socket.id}`);
  });
}
