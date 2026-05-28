import logger from '../../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/socketEvents.js';
import { getParticipantRoom } from '../utils/participantStore.js';
import { addMessage, getRecentMessages } from '../utils/messageStore.js';

const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 2000;

/**
 * Registers chat-related socket handlers.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Individual socket connection
 */
export function registerChatSocketHandlers(io, socket) {
  /**
   * send_message: User sends a message to the room
   */
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data, callback) => {
    try {
      const { roomId, message } = data;

      // Validate message content
      if (!message || message.trim().length < MESSAGE_MIN_LENGTH || message.length > MESSAGE_MAX_LENGTH) {
        const error = 'Message must be between 1 and 2000 characters';
        if (callback) callback({ success: false, error });
        return;
      }

      // Verify room membership
      const room = getParticipantRoom(socket.id);
      if (!room || room !== roomId) {
        const error = 'Not in room';
        if (callback) callback({ success: false, error });
        return;
      }

      // Store message
      const messageRecord = addMessage(roomId, {
        userId: socket.user.id,
        username: socket.user.username,
        message: message.trim(),
      });

      // Broadcast to all in room
      io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        messageId: messageRecord.messageId,
        roomId,
        userId: messageRecord.userId,
        username: messageRecord.username,
        message: messageRecord.message,
        timestamp: messageRecord.timestamp,
      });

      if (callback) callback({ success: true });

      logger.info('Message sent', {
        socketId: socket.id,
        roomId,
        messageLength: message.length,
        userId: socket.user.id,
      });
    } catch (error) {
      logger.error('Error sending message', { error: error.message });
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * get_chat_history: User requests previous messages (on room join)
   */
  socket.on(SOCKET_EVENTS.GET_CHAT_HISTORY, (data, callback) => {
    try {
      const { roomId } = data;

      // Verify room membership
      const room = getParticipantRoom(socket.id);
      if (!room || room !== roomId) {
        const error = 'Not in room';
        if (callback) callback({ success: false, error, messages: [] });
        return;
      }

      // Retrieve recent messages
      const messages = getRecentMessages(roomId, 50);

      if (callback) {
        callback({ success: true, messages });
      }

      logger.info('Chat history retrieved', {
        socketId: socket.id,
        roomId,
        messageCount: messages.length,
      });
    } catch (error) {
      logger.error('Error retrieving chat history', { error: error.message });
      if (callback) callback({ success: false, error: error.message, messages: [] });
    }
  });
}
