import logger from '../../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/socketEvents.js';
import { getRoomParticipantsForSync } from '../utils/participantManager.js';
import { getParticipantRoom } from '../utils/participantStore.js';

/**
 * Registers presence-related socket event handlers.
 * Handles participant synchronization, join/leave notifications.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Individual socket connection
 */
export function registerPresenceSocketHandlers(io, socket) {
  /**
   * participants_sync: Sent when user joins a room
   * Server broadcasts current participant list to room
   */
  socket.on(SOCKET_EVENTS.PARTICIPANTS_SYNC_REQUEST, (data, callback) => {
    try {
      const { roomId } = data;

      // Verify membership
      const currentRoom = getParticipantRoom(socket.id);
      if (currentRoom !== roomId) {
        const error = 'Not in room';
        if (callback) callback({ success: false, error });
        return;
      }

      // Get current participants
      const participants = getRoomParticipantsForSync(roomId);

      // Send back to requester
      if (callback) {
        callback({ success: true, participants });
      }

      logger.info('Participant sync requested', {
        socketId: socket.id,
        roomId,
        count: participants.length,
      });
    } catch (error) {
      logger.error('Error syncing participants', { error: error.message });
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * get_presence_status: Query current presence in a room
   */
  socket.on(SOCKET_EVENTS.GET_PRESENCE_STATUS, (data, callback) => {
    try {
      const { roomId } = data;

      // Verify membership
      const currentRoom = getParticipantRoom(socket.id);
      if (currentRoom !== roomId) {
        const error = 'Not in room';
        if (callback) callback({ success: false, error, participants: [] });
        return;
      }

      const participants = getRoomParticipantsForSync(roomId);

      if (callback) {
        callback({ success: true, participants, count: participants.length });
      }

      logger.info('Presence status queried', {
        socketId: socket.id,
        roomId,
        participantCount: participants.length,
      });
    } catch (error) {
      logger.error('Error getting presence status', { error: error.message });
      if (callback) callback({ success: false, error: error.message, participants: [] });
    }
  });
}
