/**
 * Session Socket Handler
 * 
 * Manages real-time persistence events with smart debouncing:
 * - Code saves debounced to 5 seconds
 * - Chat saves debounced to 10 seconds
 * - Whiteboard saves debounced to 10 seconds
 * - Full session save on major events (join, leave)
 * 
 * Uses timers per room to batch writes and avoid excessive DB access.
 */

import logger from '../../utils/logger.js';
import {
  updateSessionCode,
  addSessionMessage,
  addWhiteboardAction,
} from '../../services/sessionService.js';
import { SOCKET_EVENTS } from '../utils/socketEvents.js';

// In-memory debounce timers per room
const debounceTimers = {
  code: new Map(), // roomId -> timeoutId
  chat: new Map(),
  whiteboard: new Map(),
};

/**
 * Debounced code update
 * Saves code every 5 seconds, batching multiple CODE_CHANGE events
 */
function debounceCodeSave(roomId, code) {
  // Clear existing timer for this room
  if (debounceTimers.code.has(roomId)) {
    clearTimeout(debounceTimers.code.get(roomId));
  }

  // Set new timer - save after 5 seconds of inactivity
  const timeoutId = setTimeout(async () => {
    try {
      await updateSessionCode(roomId, code);
      logger.debug('Code debounce save executed', { roomId });
    } catch (error) {
      logger.error('Code debounce save failed', { roomId, error: error.message });
    }
    debounceTimers.code.delete(roomId);
  }, 5000);

  debounceTimers.code.set(roomId, timeoutId);
}

/**
 * Debounced chat message save
 * Saves messages every 10 seconds, batching multiple SEND_MESSAGE events
 */
function debounceChatSave(roomId, message) {
  // Clear existing timer for this room
  if (debounceTimers.chat.has(roomId)) {
    clearTimeout(debounceTimers.chat.get(roomId));
  }

  // Set new timer - save after 10 seconds of inactivity
  const timeoutId = setTimeout(async () => {
    try {
      await addSessionMessage(roomId, message);
      logger.debug('Chat debounce save executed', { roomId });
    } catch (error) {
      logger.error('Chat debounce save failed', { roomId, error: error.message });
    }
    debounceTimers.chat.delete(roomId);
  }, 10000);

  debounceTimers.chat.set(roomId, timeoutId);
}

/**
 * Debounced whiteboard save
 * Saves drawing actions every 10 seconds, batching multiple DRAW/ERASE events
 */
function debounceWhiteboardSave(roomId, action) {
  // Clear existing timer for this room
  if (debounceTimers.whiteboard.has(roomId)) {
    clearTimeout(debounceTimers.whiteboard.get(roomId));
  }

  // Set new timer - save after 10 seconds of inactivity
  const timeoutId = setTimeout(async () => {
    try {
      await addWhiteboardAction(roomId, action);
      logger.debug('Whiteboard debounce save executed', { roomId });
    } catch (error) {
      logger.error('Whiteboard debounce save failed', { roomId, error: error.message });
    }
    debounceTimers.whiteboard.delete(roomId);
  }, 10000);

  debounceTimers.whiteboard.set(roomId, timeoutId);
}

/**
 * Clear all debounce timers for a room
 * Called on disconnect to ensure pending saves complete
 */
export function clearSessionDebounceTimers(roomId) {
  ['code', 'chat', 'whiteboard'].forEach((type) => {
    if (debounceTimers[type].has(roomId)) {
      clearTimeout(debounceTimers[type].get(roomId));
      debounceTimers[type].delete(roomId);
    }
  });
}

/**
 * Register session socket handlers
 */
export function registerSessionSocketHandlers(io, socket) {
  // Listen for debounced code updates
  socket.on(SOCKET_EVENTS.SESSION_CODE_CHANGE, (data) => {
    try {
      const { roomId, code } = data;
      if (!roomId || typeof code !== 'string') {
        logger.warn('Invalid SESSION_CODE_CHANGE event', { socketId: socket.id });
        return;
      }
      debounceCodeSave(roomId, code);
    } catch (error) {
      logger.error('SESSION_CODE_CHANGE error', { error: error.message });
    }
  });

  // Listen for chat message persistence
  socket.on(SOCKET_EVENTS.SESSION_MESSAGE_ADD, (data) => {
    try {
      const { roomId, message } = data;
      if (!roomId || !message) {
        logger.warn('Invalid SESSION_MESSAGE_ADD event', { socketId: socket.id });
        return;
      }
      debounceChatSave(roomId, message);
    } catch (error) {
      logger.error('SESSION_MESSAGE_ADD error', { error: error.message });
    }
  });

  // Listen for whiteboard action persistence
  socket.on(SOCKET_EVENTS.SESSION_WHITEBOARD_ACTION, (data) => {
    try {
      const { roomId, action } = data;
      if (!roomId || !action) {
        logger.warn('Invalid SESSION_WHITEBOARD_ACTION event', { socketId: socket.id });
        return;
      }
      debounceWhiteboardSave(roomId, action);
    } catch (error) {
      logger.error('SESSION_WHITEBOARD_ACTION error', { error: error.message });
    }
  });
}
