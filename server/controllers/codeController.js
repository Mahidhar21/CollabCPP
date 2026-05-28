/**
 * Code Execution Controller
 * REST endpoint for code execution (optional, mainly for testing)
 */

import { executeCode } from '../services/codeExecution/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * POST /api/code/execute
 * Execute C++ code (socket-based preferred, this is fallback)
 */
export const executeCodeHandler = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    throw new AppError('Code is required and must be a string', 400);
  }

  if (code.length > 100000) {
    throw new AppError('Code too large (max 100KB)', 400);
  }

  const result = await executeCode(code, {
    compileTimeout: 10000,
    runtimeTimeout: 30000,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});
