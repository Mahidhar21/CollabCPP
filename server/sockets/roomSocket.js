import logger from '../utils/logger.js';
import { SOCKET_EVENTS } from './utils/socketEvents.js';
import {
  addParticipant,
  removeParticipant,
  getParticipantRoom,
  getRoomParticipants,
} from './utils/participantStore.js';
import { parseRoomId, assertRoomAccess } from './utils/roomAccess.js';
import { getEditorSyncPayload } from './utils/editorStateStore.js';

async function leaveCurrentRoom(io, socket) {
  const currentRoomId = getParticipantRoom(socket.id);
  if (!currentRoomId) return;

  removeParticipant(socket.id);
  socket.leave(currentRoomId);

  socket.to(currentRoomId).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
    roomId: currentRoomId,
    participant: {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
    },
  });
}

/**
 * Room-scoped socket events: join_room, leave_room.
 * Uses Socket.IO rooms for targeted broadcasts (never global).
 */
export function registerRoomSocketHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload, ack) => {
    try {
      const rawRoomId = payload?.roomId;
      const { valid, roomId, error } = parseRoomId(rawRoomId);

      if (!valid) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error });
        if (typeof ack === 'function') ack({ success: false, message: error });
        return;
      }

      const access = await assertRoomAccess(socket.user.id, roomId);
      if (!access.allowed) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: access.error });
        if (typeof ack === 'function') ack({ success: false, message: access.error });
        return;
      }

      await leaveCurrentRoom(io, socket);

      const participant = {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        roomId,
        joinedAt: new Date().toISOString(),
      };

      await socket.join(roomId);
      addParticipant(participant);

      const participants = getRoomParticipants(roomId);

      socket.to(roomId).emit(SOCKET_EVENTS.PARTICIPANT_JOINED, {
        roomId,
        participant,
      });

      io.to(roomId).emit(SOCKET_EVENTS.PARTICIPANTS_SYNC, {
        roomId,
        participants,
        count: participants.length,
      });

      socket.emit(SOCKET_EVENTS.EDITOR_CODE_SYNC, {
        roomId,
        ...getEditorSyncPayload(roomId),
      });

      logger.info('Socket joined room', {
        socketId: socket.id,
        roomId,
        userId: socket.user.id,
      });

      if (typeof ack === 'function') {
        ack({ success: true, roomId, participant });
      }
    } catch (err) {
      logger.error('join_room failed', { message: err.message });
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Failed to join room' });
      if (typeof ack === 'function') ack({ success: false, message: 'Failed to join room' });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async (payload, ack) => {
    try {
      const currentRoomId = getParticipantRoom(socket.id);
      if (!currentRoomId) {
        if (typeof ack === 'function') ack({ success: true });
        return;
      }

      const requestedRoomId = payload?.roomId
        ? parseRoomId(payload.roomId).roomId
        : currentRoomId;

      if (requestedRoomId !== currentRoomId) {
        if (typeof ack === 'function') ack({ success: false, message: 'Not in that room' });
        return;
      }

      removeParticipant(socket.id);
      socket.leave(currentRoomId);

      socket.to(currentRoomId).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
        roomId: currentRoomId,
        participant: {
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username,
        },
      });

      logger.info('Socket left room', {
        socketId: socket.id,
        roomId: currentRoomId,
        userId: socket.user.id,
      });

      if (typeof ack === 'function') ack({ success: true, roomId: currentRoomId });
    } catch (err) {
      logger.error('leave_room failed', { message: err.message });
      if (typeof ack === 'function') ack({ success: false, message: 'Failed to leave room' });
    }
  });
}
