import { SOCKET_EVENTS } from '../utils/socketEvents.js';
import { getParticipantRoom } from '../utils/participantStore.js';
import {
  updateRoomCode,
  setCursor,
  setTyping,
  removeTyping,
  pruneStaleTypers,
  getTypersList,
  clearEditorPresence,
} from '../utils/editorStateStore.js';

function getActiveRoomId(socket, payloadRoomId) {
  const roomId = getParticipantRoom(socket.id);
  if (!roomId) return null;
  if (payloadRoomId && payloadRoomId.toUpperCase() !== roomId.toUpperCase()) {
    return null;
  }
  return roomId;
}

function broadcastTyping(io, roomId) {
  const typers = pruneStaleTypers(roomId);
  io.to(roomId).emit(SOCKET_EVENTS.EDITOR_TYPING_UPDATE, { roomId, typers });
}

/**
 * Collaborative editor socket handlers.
 * All broadcasts are room-scoped via socket.to(roomId).
 */
export function registerEditorSocketHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.CODE_CHANGE, (payload) => {
    const roomId = getActiveRoomId(socket, payload?.roomId);
    if (!roomId || typeof payload?.code !== 'string') return;

    const version = updateRoomCode(roomId, payload.code);

    socket.to(roomId).emit(SOCKET_EVENTS.EDITOR_CODE_CHANGE, {
      roomId,
      code: payload.code,
      version,
      origin: {
        userId: socket.user.id,
        socketId: socket.id,
        username: socket.user.username,
      },
    });
  });

  socket.on(SOCKET_EVENTS.CURSOR_MOVE, (payload) => {
    const roomId = getActiveRoomId(socket, payload?.roomId);
    if (!roomId || !payload?.position) return;

    const cursor = {
      userId: socket.user.id,
      socketId: socket.id,
      username: socket.user.username,
      position: {
        lineNumber: payload.position.lineNumber,
        column: payload.position.column,
      },
      selection: payload.selection || null,
    };

    setCursor(roomId, socket.user.id, cursor);

    socket.to(roomId).emit(SOCKET_EVENTS.EDITOR_CURSOR_MOVE, {
      roomId,
      cursor,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_START, (payload) => {
    const roomId = getActiveRoomId(socket, payload?.roomId);
    if (!roomId) return;

    setTyping(roomId, socket.user.id, {
      username: socket.user.username,
      socketId: socket.id,
    });

    broadcastTyping(io, roomId);
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload) => {
    const roomId = getActiveRoomId(socket, payload?.roomId);
    if (!roomId) return;

    removeTyping(roomId, socket.user.id);
    broadcastTyping(io, roomId);
  });
}

export function handleEditorDisconnect(io, socket, meta) {
  if (!meta?.roomId) return;

  const { roomId, userId } = meta;

  clearEditorPresence(roomId, userId);

  socket.to(roomId).emit(SOCKET_EVENTS.EDITOR_CURSOR_REMOVE, {
    roomId,
    userId,
  });

  const typers = getTypersList(roomId);
  io.to(roomId).emit(SOCKET_EVENTS.EDITOR_TYPING_UPDATE, { roomId, typers });
}
