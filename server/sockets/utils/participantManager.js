import { addParticipant, removeParticipant, getRoomParticipants, getParticipantRoom } from './participantStore.js';

/**
 * Enhanced participant manager with presence tracking utilities.
 * Builds on participantStore.js with lifecycle management.
 */

/**
 * Adds a participant and returns all room participants.
 * @param {Object} participant - { socketId, userId, username, roomId }
 * @returns {Array} Updated room participants
 */
export function addParticipantAndBroadcast(participant) {
  addParticipant({
    ...participant,
    joinedAt: new Date().toISOString(),
  });

  return getRoomParticipants(participant.roomId);
}

/**
 * Removes a participant and returns updated room state.
 * @param {string} socketId
 * @returns {Object} { meta: { roomId, userId, username }, remainingParticipants: [] }
 */
export function removeParticipantAndBroadcast(socketId) {
  const meta = removeParticipant(socketId);

  if (!meta) {
    return { meta: null, remainingParticipants: [] };
  }

  const remainingParticipants = getRoomParticipants(meta.roomId);

  return {
    meta,
    remainingParticipants,
  };
}

/**
 * Gets all participants in a room with sanitized data.
 * @param {string} roomId
 * @returns {Array} Participants formatted for broadcast
 */
export function getRoomParticipantsForSync(roomId) {
  const participants = getRoomParticipants(roomId);
  return participants.map((p) => ({
    socketId: p.socketId,
    userId: p.userId,
    username: p.username,
    joinedAt: p.joinedAt,
  }));
}

/**
 * Checks if a socket is in a specific room.
 * @param {string} socketId
 * @param {string} roomId
 * @returns {boolean}
 */
export function isSocketInRoom(socketId, roomId) {
  const room = getParticipantRoom(socketId);
  return room === roomId;
}

/**
 * Gets participant count for a room.
 * @param {string} roomId
 * @returns {number}
 */
export function getRoomParticipantCount(roomId) {
  return getRoomParticipants(roomId).length;
}

/**
 * Verifies a participant exists in room before allowing action.
 * @param {string} socketId
 * @param {string} roomId
 * @returns {Object|null} Participant data if valid, null otherwise
 */
export function verifyRoomMembership(socketId, roomId) {
  const actualRoom = getParticipantRoom(socketId);
  if (actualRoom !== roomId) return null;

  const participants = getRoomParticipants(roomId);
  return participants.find((p) => p.socketId === socketId) || null;
}
