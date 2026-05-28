import { DEFAULT_CPP_CODE } from './defaultCode.js';

/**
 * In-memory per-room editor state (code, cursors, typers).
 * Replace with Redis for multi-instance deployments in production.
 */

const roomStates = new Map();

const TYPING_TTL_MS = 4000;

function createRoomState() {
  return {
    code: DEFAULT_CPP_CODE,
    version: 0,
    cursors: new Map(),
    typers: new Map(),
  };
}

export function getOrCreateRoomState(roomId) {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, createRoomState());
  }
  return roomStates.get(roomId);
}

export function updateRoomCode(roomId, code) {
  const state = getOrCreateRoomState(roomId);
  state.code = code;
  state.version += 1;
  return state.version;
}

export function setCursor(roomId, userId, cursor) {
  const state = getOrCreateRoomState(roomId);
  state.cursors.set(userId, {
    ...cursor,
    userId,
    updatedAt: Date.now(),
  });
}

export function removeCursor(roomId, userId) {
  const state = roomStates.get(roomId);
  if (!state) return;
  state.cursors.delete(userId);
}

export function setTyping(roomId, userId, data) {
  const state = getOrCreateRoomState(roomId);
  state.typers.set(userId, {
    userId,
    username: data.username,
    socketId: data.socketId,
    updatedAt: Date.now(),
  });
}

export function removeTyping(roomId, userId) {
  const state = roomStates.get(roomId);
  if (!state) return;
  state.typers.delete(userId);
}

export function pruneStaleTypers(roomId) {
  const state = roomStates.get(roomId);
  if (!state) return [];
  const now = Date.now();
  for (const [userId, t] of state.typers) {
    if (now - t.updatedAt > TYPING_TTL_MS) {
      state.typers.delete(userId);
    }
  }
  return getTypersList(roomId);
}

export function getTypersList(roomId) {
  const state = roomStates.get(roomId);
  if (!state) return [];
  return Array.from(state.typers.values()).map((t) => ({
    userId: t.userId,
    username: t.username,
  }));
}

export function getCursorsList(roomId) {
  const state = roomStates.get(roomId);
  if (!state) return [];
  return Array.from(state.cursors.values());
}

export function getEditorSyncPayload(roomId) {
  pruneStaleTypers(roomId);
  const state = getOrCreateRoomState(roomId);
  return {
    code: state.code,
    version: state.version,
    cursors: getCursorsList(roomId),
    typers: getTypersList(roomId),
  };
}

export function clearEditorPresence(roomId, userId) {
  removeCursor(roomId, userId);
  removeTyping(roomId, userId);
}

export function deleteRoomState(roomId) {
  roomStates.delete(roomId);
}
