/**
 * Code Execution Routes
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { executeCodeHandler } from '../controllers/codeController.js';

const router = express.Router();

// Protect all code routes
router.use(protect);

/**
 * POST /api/code/execute
 * Execute C++ code
 */
router.post('/execute', executeCodeHandler);

export default router;
