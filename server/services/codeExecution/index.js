/**
 * Code Execution Orchestrator
 * Main entry point for C++ code execution workflow
 */

import { compileCpp } from './compileCpp.js';
import { executeProcess } from './processManager.js';
import {
  createTempDirectory,
  writeTempSourceFile,
  getBinaryPath,
  cleanupTempDirectory,
} from './tempFileManager.js';
import logger from '../../utils/logger.js';

/**
 * Execute C++ code with compilation and runtime
 * @param {string} code - C++ source code
 * @param {Object} options - Execution options
 * @param {number} options.compileTimeout - Compilation timeout (ms, default 10000)
 * @param {number} options.runtimeTimeout - Runtime timeout (ms, default 30000)
 * @returns {Promise<Object>} Execution result
 */
export async function executeCode(code, options = {}) {
  const {
    compileTimeout = 10000,
    runtimeTimeout = 30000,
  } = options;

  const tempDir = createTempDirectory();
  let sourceFile = null;
  let binaryPath = null;

  try {
    // Step 1: Write source to temp file
    logger.info(`[CodeExecution] Creating temp directory: ${tempDir}`);
    sourceFile = await writeTempSourceFile(tempDir, code);

    // Step 2: Compile
    logger.info(`[CodeExecution] Compiling ${sourceFile}`);
    binaryPath = getBinaryPath(tempDir);
    const compileResult = await compileCpp(sourceFile, binaryPath, compileTimeout);

    if (!compileResult.success) {
      logger.warn(`[CodeExecution] Compilation failed`);
      return {
        stdout: '',
        stderr: compileResult.stderr,
        compileSuccess: false,
        runtimeSuccess: false,
        executionTime: 0,
        compileTime: compileResult.compileTime,
      };
    }

    logger.info(`[CodeExecution] Compilation successful (${compileResult.compileTime}ms)`);

    // Step 3: Execute
    logger.info(`[CodeExecution] Executing ${binaryPath}`);
    const runtimeResult = await executeProcess(binaryPath, runtimeTimeout);

    logger.info(`[CodeExecution] Execution completed (${runtimeResult.executionTime}ms, timedOut: ${runtimeResult.timedOut})`);

    return {
      stdout: runtimeResult.stdout,
      stderr: runtimeResult.stderr,
      compileSuccess: true,
      runtimeSuccess: runtimeResult.runtimeSuccess,
      executionTime: runtimeResult.executionTime,
      compileTime: compileResult.compileTime,
      timedOut: runtimeResult.timedOut,
    };
  } catch (error) {
    logger.error(`[CodeExecution] Execution error: ${error.message}`);
    return {
      stdout: '',
      stderr: `Execution error: ${error.message}`,
      compileSuccess: false,
      runtimeSuccess: false,
      executionTime: 0,
      compileTime: 0,
    };
  } finally {
    // Always cleanup
    logger.info(`[CodeExecution] Cleaning up temp directory: ${tempDir}`);
    await cleanupTempDirectory(tempDir);
  }
}
