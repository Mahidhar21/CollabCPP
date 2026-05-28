import { randomUUID } from 'crypto';

const messageStores = new Map(); // Map<roomId, Message[]>
const MAX_MESSAGES_PER_ROOM = 1000;

/**
 * Adds a message to the room's message store.
 * @param {string} roomId - The room ID
 * @param {Object} data - Message data { userId, username, message }
 * @returns {Object} The stored message with ID and timestamp
 */
export function addMessage(roomId, data) {
  if (!messageStores.has(roomId)) {
    messageStores.set(roomId, []);
  }

  const messageRecord = {
    messageId: randomUUID(),
    roomId,
    userId: data.userId,
    username: data.username,
    message: data.message,
    timestamp: Date.now(),
  };

  const messages = messageStores.get(roomId);
  messages.push(messageRecord);

  // Keep only last N messages per room
  if (messages.length > MAX_MESSAGES_PER_ROOM) {
    messages.shift();
  }

  return messageRecord;
}

/**
 * Gets recent messages from a room.
 * @param {string} roomId - The room ID
 * @param {number} limit - Max messages to return (default 50)
 * @returns {Array} Array of messages
 */
export function getRecentMessages(roomId, limit = 50) {
  const messages = messageStores.get(roomId) || [];
  return messages.slice(-limit);
}

/**
 * Clears all messages for a room (on room cleanup).
 * @param {string} roomId - The room ID
 */
export function clearRoomMessages(roomId) {
  messageStores.delete(roomId);
}
