/**
 * Compilation Logic for C++
 * Handles g++ compilation with error capture
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Compile C++ source to binary using g++
 * @param {string} sourceFile - Path to .cpp source file
 * @param {string} outputBinary - Path to output binary
 * @param {number} timeout - Compilation timeout in ms (default 10s)
 * @returns {Promise<{ success: boolean, stderr: string, compileTime: number }>}
 */
export async function compileCpp(sourceFile, outputBinary, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stderr = '';
    let stdout = '';
    let timedOut = false;

    const compiler = spawn('g++', [
      '-o',
      outputBinary,
      sourceFile,
      '-std=c++17',
      '-Wall',
      '-Wextra',
    ]);

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      compiler.kill('SIGTERM');
    }, timeout);

    compiler.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    compiler.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    compiler.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const compileTime = Date.now() - startTime;

      if (timedOut) {
        resolve({
          success: false,
          stderr: 'Compilation timed out',
          compileTime,
        });
      } else if (code === 0) {
        resolve({
          success: true,
          stderr: '',
          compileTime,
        });
      } else {
        resolve({
          success: false,
          stderr: stderr || stdout || `Compilation failed with code ${code}`,
          compileTime,
        });
      }
    });

    compiler.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        success: false,
        stderr: `Compilation error: ${err.message}`,
        compileTime: Date.now() - startTime,
      });
    });
  });
}
