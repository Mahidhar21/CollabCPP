/**
 * Session Routes
 * Protected routes for session persistence
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSession,
  saveSessionData,
  getRecentSessionsData,
  deleteSessionData,
  deactivateSessionData,
} from '../controllers/sessionController.js';

const router = express.Router();

// Protect all session routes
router.use(protect);

/**
 * GET /api/sessions/:roomId
 * Fetch saved session data
 */
router.get('/:roomId', getSession);

/**
 * POST /api/sessions/save
 * Persist current session state
 */
router.post('/save', saveSessionData);

/**
 * GET /api/sessions/recent
 * Fetch recent sessions for current user
 */
router.get('/', getRecentSessionsData);

/**
 * DELETE /api/sessions/:roomId
 * Delete a session
 */
router.delete('/:roomId', deleteSessionData);

/**
 * PATCH /api/sessions/:roomId/deactivate
 * Mark session as inactive
 */
router.patch('/:roomId/deactivate', deactivateSessionData);

export default router;
