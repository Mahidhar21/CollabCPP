/**
 * In-memory presence store for active socket participants per room.
 * Phase 4 foundation — production would use Redis for horizontal scaling.
 *
 * Structure:
 *   rooms: Map<roomId, Map<socketId, Participant>>
 *   socketIndex: Map<socketId, { roomId, userId, username }>
 */

/**
 * @typedef {Object} Participant
 * @property {string} socketId
 * @property {string} userId
 * @property {string} username
 * @property {string} roomId
 * @property {string} joinedAt
 */

const rooms = new Map();
const socketIndex = new Map();

export function addParticipant(participant) {
  const { roomId, socketId } = participant;

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }

  rooms.get(roomId).set(socketId, participant);
  socketIndex.set(socketId, {
    roomId,
    userId: participant.userId,
    username: participant.username,
  });
}

export function removeParticipant(socketId) {
  const meta = socketIndex.get(socketId);
  if (!meta) return null;

  const roomMap = rooms.get(meta.roomId);
  if (roomMap) {
    roomMap.delete(socketId);
    if (roomMap.size === 0) {
      rooms.delete(meta.roomId);
    }
  }

  socketIndex.delete(socketId);
  return meta;
}

export function getParticipantRoom(socketId) {
  return socketIndex.get(socketId)?.roomId ?? null;
}

export function getRoomParticipants(roomId) {
  const roomMap = rooms.get(roomId);
  if (!roomMap) return [];
  return Array.from(roomMap.values());
}

export function getActiveRoomCount() {
  return rooms.size;
}

export function getTotalConnections() {
  return socketIndex.size;
}
