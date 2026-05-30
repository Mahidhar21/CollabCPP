/**
 * Output Console Panel
 * Displays code execution with stdin input and stdout/stderr output
 */

import React from 'react';
import { cn } from '../../utils/cn.js';
import RoomPanel from './RoomPanel.jsx';

export default function OutputPanel({ 
  output, 
  isExecuting, 
  error,
  stdinInput,
  onStdinChange,
}) {
  const result = output?.result;
  const executedBy = output?.executedBy;

  return (
    <RoomPanel 
      title="Execution" 
      subtitle="Input & Output" 
      className="h-full flex flex-col min-h-0"
      bodyClassName="p-0 flex flex-1 min-h-0"
    >
      <div className="flex h-full min-h-0 w-full overflow-hidden rounded-b-lg bg-[#070809]">
        {/* Stdin Panel */}
        <div className="flex-1 min-w-0 border-r border-surface-border bg-surface-overlay/80 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent-dim">Program input</p>
              <p className="text-[10px] text-surface-muted">Stdin sent to the running program</p>
            </div>
            <span className="text-[10px] text-surface-muted">{stdinInput?.length || 0} chars</span>
          </div>

          <textarea
            value={stdinInput || ''}
            onChange={(e) => onStdinChange?.(e.target.value)}
            disabled={isExecuting}
            placeholder="Enter input for stdin..."
            className="flex-1 min-h-0 resize-none rounded border border-surface-border bg-black/90 p-3 text-xs font-mono text-white outline-none ring-0 transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Output Panel */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-surface-border bg-surface-overlay/80 p-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent-dim">Execution output</p>
              <p className="text-[10px] text-surface-muted">Stdout, stderr, compile & runtime status</p>
            </div>
            <div className="text-right text-[10px] text-surface-muted">
              {executedBy && <p>Last run by {executedBy.username}</p>}
              <p>{isExecuting ? 'Running...' : result ? 'Ready' : 'Idle'}</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-surface-border bg-[#010203] p-3 text-xs text-white font-mono w-full">
            {isExecuting && (
              <div className="mb-3 flex items-center gap-2 text-accent">
                <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                <span>Executing program…</span>
              </div>
            )}

            {error && (
              <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                <p className="font-semibold text-sm">Execution error</p>
                <p className="mt-1 whitespace-pre-wrap">{error}</p>
              </div>
            )}

            {result ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded border border-surface-border bg-surface-overlay/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-accent-dim">Compile status</p>
                    <p className={`mt-2 text-sm font-semibold ${result.compileSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.compileSuccess ? 'Compiled successfully' : 'Compilation failed'}
                    </p>
                    <p className="mt-1 text-[10px] text-surface-muted">{result.compileTime} ms</p>
                  </div>

                  <div className="rounded border border-surface-border bg-surface-overlay/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-accent-dim">Runtime status</p>
                    <p className={`mt-2 text-sm font-semibold ${result.runtimeSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.runtimeSuccess ? 'Runtime successful' : 'Runtime failed'}
                    </p>
                    <p className="mt-1 text-[10px] text-surface-muted">{result.executionTime} ms</p>
                    {result.timedOut && <p className="mt-1 text-[10px] text-orange-400">Timeout exceeded</p>}
                  </div>
                </div>

                {!result.compileSuccess && result.stderr && (
                  <div className="rounded border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-red-200/70">Compiler output</p>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] text-red-100">{result.stderr}</pre>
                  </div>
                )}

                {result.compileSuccess && result.stderr && (
                  <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-yellow-200/70">Runtime stderr</p>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] text-white">{result.stderr}</pre>
                  </div>
                )}

                {result.stdout ? (
                  <div className="rounded border border-surface-border bg-surface-overlay/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-accent-dim">Program output</p>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-[11px] text-white">{result.stdout}</pre>
                  </div>
                ) : (
                  !error && !isExecuting && (
                    <div className="rounded border border-surface-border bg-surface-overlay/60 p-3 text-white/70">
                      No program output available.
                    </div>
                  )
                )}
              </div>
            ) : (
              !error && !isExecuting && (
                <div className="flex h-full min-h-[140px] items-center justify-center text-surface-muted">
                  No output yet. Run your code to see execution results.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </RoomPanel>
  );
}
