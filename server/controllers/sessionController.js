/**
 * Session Controller
 * REST API handlers for session persistence
 */

import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  saveSession,
  loadSession,
  getRecentSessions,
  deactivateSession,
  deleteSession,
} from '../services/sessionService.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * GET /api/sessions/:roomId
 * Fetch saved session data
 */
export const getSession = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  const session = await loadSession(roomId);

  if (!session) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No saved session found',
    });
  }

  res.status(200).json({
    success: true,
    data: session,
  });
});

/**
 * POST /api/sessions/save
 * Persist current session state from client
 * Body: { roomId, title, owner, participants, currentCode, chatHistory, whiteboardData }
 */
export const saveSessionData = asyncHandler(async (req, res, next) => {
  const { roomId, title, owner, participants, currentCode, chatHistory, whiteboardData } =
    req.body;

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  if (!title) {
    throw new AppError('Room title is required', 400);
  }

  const session = await saveSession({
    roomId,
    title,
    owner: owner || req.user.id,
    participants: participants || [],
    currentCode: currentCode || '',
    chatHistory: chatHistory || [],
    whiteboardData: whiteboardData || [],
  });

  res.status(200).json({
    success: true,
    data: {
      roomId: session.roomId,
      savedAt: session.updatedAt,
    },
    message: 'Session saved successfully',
  });
});

/**
 * GET /api/sessions/recent
 * Fetch recent sessions for current user
 * Query params: ?limit=20
 */
export const getRecentSessionsData = asyncHandler(async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const sessions = await getRecentSessions(req.user.id, limit);

  res.status(200).json({
    success: true,
    data: sessions,
    count: sessions.length,
  });
});

/**
 * DELETE /api/sessions/:roomId
 * Delete a session (owner or admin only)
 */
export const deleteSessionData = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  const session = await loadSession(roomId);

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Verify ownership
  if (session.owner.toString() !== req.user.id.toString()) {
    throw new AppError('Only session owner can delete', 403);
  }

  const deleted = await deleteSession(roomId);

  if (!deleted) {
    throw new AppError('Failed to delete session', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Session deleted successfully',
  });
});

/**
 * PATCH /api/sessions/:roomId/deactivate
 * Mark session as inactive (on room close)
 */
export const deactivateSessionData = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  const result = await deactivateSession(roomId);

  if (!result) {
    throw new AppError('Failed to deactivate session', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Session deactivated',
  });
});
