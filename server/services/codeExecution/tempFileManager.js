/**
 * Temporary File Management
 * Creates, tracks, and cleans up temporary files
 */

import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary directory for execution
 * @returns {string} Path to temp directory
 */
export function createTempDirectory() {
  const baseDir = tmpdir();
  const prefix = `collabcpp-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const tempDir = path.join(baseDir, prefix);
  return tempDir;
}

/**
 * Write source code to temporary file
 * @param {string} tempDir - Temporary directory path
 * @param {string} code - C++ source code
 * @returns {Promise<string>} Path to created .cpp file
 */
export async function writeTempSourceFile(tempDir, code) {
  try {
    await fs.mkdir(tempDir, { recursive: true });
    const sourceFile = path.join(tempDir, 'main.cpp');
    await fs.writeFile(sourceFile, code, 'utf-8');
    return sourceFile;
  } catch (error) {
    throw new Error(`Failed to write temp source file: ${error.message}`);
  }
}

/**
 * Get path for output binary
 * @param {string} tempDir - Temporary directory path
 * @returns {string} Path to output binary
 */
export function getBinaryPath(tempDir) {
  // On Windows, append .exe; on Unix, no extension
  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'main.exe' : 'main';
  return path.join(tempDir, binaryName);
}

/**
 * Cleanup temporary directory and all contents
 * @param {string} tempDir - Temporary directory path
 * @returns {Promise<void>}
 */
export async function cleanupTempDirectory(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Log but don't throw — cleanup failure shouldn't break execution
    console.warn(`Warning: Failed to cleanup temp directory ${tempDir}:`, error.message);
  }
}
