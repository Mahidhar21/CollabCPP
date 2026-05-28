/**
 * Process Execution and Timeout Management
 * Handles binary execution with strict timeout and resource limits
 */

import { spawn } from 'child_process';

/**
 * Execute C++ binary with timeout protection
 * @param {string} binaryPath - Path to executable binary
 * @param {number} timeout - Execution timeout in ms (default 30s)
 * @returns {Promise<{ stdout: string, stderr: string, runtimeSuccess: boolean, executionTime: number, timedOut: boolean }>}
 */
export async function executeProcess(binaryPath, timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const process = spawn(binaryPath, [], {
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      process.kill('SIGTERM');

      // Force kill after 2s if SIGTERM didn't work
      setTimeout(() => {
        try {
          process.kill('SIGKILL');
        } catch (e) {
          // Already dead, ignore
        }
      }, 2000);
    }, timeout);

    // Collect output
    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      // Cap output to 10MB to prevent memory issues
      if (stdout.length > 10 * 1024 * 1024) {
        process.kill('SIGTERM');
        stdout = stdout.substring(0, 10 * 1024 * 1024) + '\n[Output truncated — exceeded 10MB limit]';
      }
    });

    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      // Cap stderr to 1MB
      if (stderr.length > 1 * 1024 * 1024) {
        process.kill('SIGTERM');
        stderr = stderr.substring(0, 1 * 1024 * 1024) + '\n[Errors truncated — exceeded 1MB limit]';
      }
    });

    process.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const executionTime = Date.now() - startTime;

      if (timedOut) {
        resolve({
          stdout,
          stderr: stderr || 'Process exceeded time limit',
          runtimeSuccess: false,
          executionTime,
          timedOut: true,
        });
      } else if (code === 0) {
        resolve({
          stdout,
          stderr,
          runtimeSuccess: true,
          executionTime,
          timedOut: false,
        });
      } else {
        resolve({
          stdout,
          stderr: stderr || `Process exited with code ${code}`,
          runtimeSuccess: false,
          executionTime,
          timedOut: false,
        });
      }
    });

    process.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        stdout,
        stderr: `Execution error: ${err.message}`,
        runtimeSuccess: false,
        executionTime: Date.now() - startTime,
        timedOut: false,
      });
    });
  });
}
