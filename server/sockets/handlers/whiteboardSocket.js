import logger from '../../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/socketEvents.js';
import { getParticipantRoom } from '../utils/participantStore.js';

/**
 * Registers whiteboard socket event handlers.
 * Handles drawing, erasing, and canvas clearing with room-scoped broadcasting.
 *
 * Socket Events:
 * - draw: Broadcast pen and eraser strokes as structured actions
 * - erase: Legacy erase event for backwards compatibility
 * - clear_canvas: Broadcast canvas clear
 *
 * All events broadcast ONLY within the room (no global broadcasts).
 */
export function registerWhiteboardSocketHandlers(io, socket) {
  const broadcastAction = ({ roomId, action }) => {
    socket.to(roomId).emit(SOCKET_EVENTS.DRAW, {
      roomId,
      action,
      userId: socket.user.id,
      socketId: socket.id,
    });
  };

  socket.on(SOCKET_EVENTS.DRAW, (data) => {
    try {
      const { roomId, action, x, y, x0, y0, size } = data;
      const room = getParticipantRoom(socket.id);

      if (!room || room !== roomId) {
        logger.warn('Draw event from non-member', {
          socketId: socket.id,
          requestedRoom: roomId,
          actualRoom: room,
        });
        return;
      }

      if (action && typeof action === 'object' && action.type) {
        if (!Array.isArray(action.points) || action.points.length === 0) {
          logger.warn('Invalid draw action payload', { socketId: socket.id, roomId });
          return;
        }

        broadcastAction({ roomId, action });
        logger.debug('Draw action broadcasted', {
          socketId: socket.id,
          roomId,
          actionType: action.type,
          pointCount: action.points.length,
        });
        return;
      }

      if (typeof x !== 'number' || typeof y !== 'number' || typeof x0 !== 'number' || typeof y0 !== 'number') {
        logger.warn('Invalid legacy draw coordinates', { socketId: socket.id, roomId });
        return;
      }

      broadcastAction({
        roomId,
        action: {
          type: 'DRAW',
          points: [{ x: x0, y: y0 }, { x, y }],
          tool: 'pen',
          size: size || 3,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug('Legacy draw broadcasted', {
        socketId: socket.id,
        roomId,
        coordinates: `(${x0},${y0}) → (${x},${y})`,
      });
    } catch (error) {
      logger.error('Error handling draw event', { error: error.message });
    }
  });

  socket.on(SOCKET_EVENTS.ERASE, (data) => {
    try {
      const { roomId, action, x, y, x0, y0, size } = data;
      const room = getParticipantRoom(socket.id);

      if (!room || room !== roomId) {
        logger.warn('Erase event from non-member', {
          socketId: socket.id,
          requestedRoom: roomId,
          actualRoom: room,
        });
        return;
      }

      if (action && typeof action === 'object' && action.type) {
        if (!Array.isArray(action.points) || action.points.length === 0) {
          logger.warn('Invalid erase action payload', { socketId: socket.id, roomId });
          return;
        }

        broadcastAction({ roomId, action });
        logger.debug('Erase action broadcasted', {
          socketId: socket.id,
          roomId,
          pointCount: action.points.length,
        });
        return;
      }

      if (typeof x !== 'number' || typeof y !== 'number' || typeof x0 !== 'number' || typeof y0 !== 'number') {
        logger.warn('Invalid legacy erase coordinates', { socketId: socket.id, roomId });
        return;
      }

      broadcastAction({
        roomId,
        action: {
          type: 'ERASE',
          points: [{ x: x0, y: y0 }, { x, y }],
          tool: 'eraser',
          size: size || 15,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug('Legacy erase broadcasted', {
        socketId: socket.id,
        roomId,
        coordinates: `(${x0},${y0}) → (${x},${y})`,
      });
    } catch (error) {
      logger.error('Error handling erase event', { error: error.message });
    }
  });

  socket.on(SOCKET_EVENTS.CLEAR_CANVAS, (data) => {
    try {
      const { roomId } = data;
      const room = getParticipantRoom(socket.id);

      if (!room || room !== roomId) {
        logger.warn('Clear canvas event from non-member', {
          socketId: socket.id,
          requestedRoom: roomId,
          actualRoom: room,
        });
        return;
      }

      io.to(roomId).emit(SOCKET_EVENTS.CLEAR_CANVAS, {
        roomId,
        userId: socket.user.id,
        socketId: socket.id,
      });

      logger.info('Canvas cleared', {
        socketId: socket.id,
        roomId,
        username: socket.user.username,
      });
    } catch (error) {
      logger.error('Error handling clear canvas event', { error: error.message });
    }
  });
}
