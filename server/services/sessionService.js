/**
 * Session Service
 * 
 * Handles persistent session storage with smart debouncing strategy:
 * - Debounced code saves (triggered on CODE_CHANGE, batched every 5 seconds)
 * - Debounced chat saves (triggered on messages, batched every 10 seconds)
 * - Save-on-major-events (join, leave, disconnect)
 * - Interval-based persistence (save state every 30 seconds while room is active)
 * 
 * Avoids excessive DB writes while maintaining data integrity.
 */

import { Session } from '../models/Session.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

/**
 * Save or update a session
 * Called by debounced handlers, socket handlers, and disconnect events
 */
export async function saveSession(sessionData) {
  try {
    const { roomId, title, owner, participants, currentCode, chatHistory, whiteboardData } =
      sessionData;

    const session = await Session.findOneAndUpdate(
      { roomId },
      {
        roomId,
        title,
        owner,
        participants: participants || [],
        currentCode: currentCode || '',
        chatHistory: chatHistory || [],
        whiteboardData: whiteboardData || [],
        lastActive: new Date(),
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    logger.debug('Session saved', { roomId, hasCode: !!currentCode });
    return session;
  } catch (error) {
    logger.error('Error saving session', { error: error.message });
    throw new AppError('Failed to save session', 500);
  }
}

/**
 * Load a session by roomId
 */
export async function loadSession(roomId) {
  try {
    const session = await Session.findOne({ roomId }).populate(
      'owner participants.user chatHistory.sender',
      'username email'
    );

    if (!session) {
      return null;
    }

    return {
      roomId: session.roomId,
      title: session.title,
      owner: session.owner,
      participants: session.participants,
      currentCode: session.currentCode,
      chatHistory: session.chatHistory,
      whiteboardData: session.whiteboardData,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
    };
  } catch (error) {
    logger.error('Error loading session', { error: error.message, roomId });
    throw new AppError('Failed to load session', 500);
  }
}

/**
 * Get recent sessions for a user
 * Limited to 20 most recent active sessions
 */
export async function getRecentSessions(userId, limit = 20) {
  try {
    const sessions = await Session.find({
      $or: [{ owner: userId }, { 'participants.user': userId }],
    })
      .select('roomId title owner createdAt lastActive isActive')
      .populate('owner', 'username')
      .sort({ lastActive: -1 })
      .limit(limit);

    return sessions;
  } catch (error) {
    logger.error('Error fetching recent sessions', { error: error.message, userId });
    throw new AppError('Failed to fetch sessions', 500);
  }
}

/**
 * Update only code (debounced from CODE_CHANGE events)
 * Minimal write - only updates code and lastActive
 */
export async function updateSessionCode(roomId, code) {
  try {
    const session = await Session.findOneAndUpdate(
      { roomId },
      {
        currentCode: code,
        lastActive: new Date(),
      },
      { upsert: true, new: false }
    );

    return !!session;
  } catch (error) {
    logger.error('Error updating session code', { error: error.message, roomId });
    // Non-critical, don't throw
    return false;
  }
}

/**
 * Add message to session chat history
 * Keeps only last 1000 messages per room
 */
export async function addSessionMessage(roomId, message) {
  try {
    const session = await Session.findOne({ roomId });

    if (!session) {
      return false;
    }

    if (!session.chatHistory) {
      session.chatHistory = [];
    }

    session.chatHistory.push({
      sender: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp || new Date(),
    });

    // Keep only last 1000 messages
    if (session.chatHistory.length > 1000) {
      session.chatHistory = session.chatHistory.slice(-1000);
    }

    session.lastActive = new Date();
    await session.save();

    return true;
  } catch (error) {
    logger.error('Error adding session message', { error: error.message, roomId });
    // Non-critical, don't throw
    return false;
  }
}

/**
 * Add drawing action to whiteboard history
 * Keeps only last 10000 actions per room
 */
export async function addWhiteboardAction(roomId, action) {
  try {
    const session = await Session.findOne({ roomId });

    if (!session) {
      return false;
    }

    if (!session.whiteboardData) {
      session.whiteboardData = [];
    }

    session.whiteboardData.push({
      type: action.type,
      x: action.x,
      y: action.y,
      x0: action.x0,
      y0: action.y0,
      size: action.size,
      timestamp: action.timestamp || new Date(),
    });

    // Keep only last 10000 actions
    if (session.whiteboardData.length > 10000) {
      session.whiteboardData = session.whiteboardData.slice(-10000);
    }

    session.lastActive = new Date();
    await session.save();

    return true;
  } catch (error) {
    logger.error('Error adding whiteboard action', { error: error.message, roomId });
    // Non-critical, don't throw
    return false;
  }
}

/**
 * Mark session as inactive (on room close or owner disconnect)
 */
export async function deactivateSession(roomId) {
  try {
    await Session.findOneAndUpdate(
      { roomId },
      {
        isActive: false,
        lastActive: new Date(),
      }
    );

    logger.debug('Session deactivated', { roomId });
    return true;
  } catch (error) {
    logger.error('Error deactivating session', { error: error.message, roomId });
    return false;
  }
}

/**
 * Delete a session (when room is deleted)
 */
export async function deleteSession(roomId) {
  try {
    const result = await Session.findOneAndDelete({ roomId });
    logger.debug('Session deleted', { roomId });
    return !!result;
  } catch (error) {
    logger.error('Error deleting session', { error: error.message, roomId });
    return false;
  }
}

/**
 * Get session count for a user
 */
export async function getUserSessionCount(userId) {
  try {
    return await Session.countDocuments({
      $or: [{ owner: userId }, { 'participants.user': userId }],
    });
  } catch (error) {
    logger.error('Error counting sessions', { error: error.message, userId });
    return 0;
  }
}
