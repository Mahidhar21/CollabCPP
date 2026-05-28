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
  // Extract result from output object
  const result = output?.result;
  const executedBy = output?.executedBy;

  return (
    <RoomPanel 
      title="Execution" 
      subtitle="Input & Output" 
      className="h-48 shrink-0" 
      bodyClassName="p-0 flex flex-col min-h-0"
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Stdin Input Section */}
        <div className="flex-shrink-0 border-b border-surface-border bg-surface-overlay/40">
          <div className="px-3 py-2 border-b border-surface-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-accent-dim uppercase tracking-wider">stdin Input</span>
            <span className="text-[10px] text-surface-muted">{stdinInput?.length || 0} chars</span>
          </div>
          <textarea
            value={stdinInput || ''}
            onChange={(e) => onStdinChange?.(e.target.value)}
            disabled={isExecuting}
            placeholder="Provide input for the program here (optional)"
            className="w-full h-20 p-2 font-mono text-xs bg-surface text-accent border-0 outline-none resize-none disabled:opacity-50 placeholder-accent-dim/50"
          />
        </div>

        {/* Stdout/Stderr Output Section */}
        <div className="flex-1 overflow-auto min-h-0 bg-surface">
          <div className="p-3 font-mono text-xs">
            {/* Execution Status */}
            <div className="mb-3 pb-3 border-b border-surface-border/50">
              {isExecuting && (
                <div className="flex items-center gap-2 text-surface-muted">
                  <div className="w-1.5 h-1.5 bg-accent-muted rounded-full animate-pulse" />
                  <span>Executing...</span>
                </div>
              )}

              {error && (
                <div className="text-red-400">
                  <span className="font-medium">Error:</span> {error}
                </div>
              )}

              {!result && !error && !isExecuting && (
                <div className="text-surface-muted/60">
                  No output yet. Run your code to see results.
                </div>
              )}

              {result && (
                <div className="space-y-2">
                  {/* Compilation Status */}
                  <div className={cn(
                    'text-xs font-medium flex items-center gap-1.5',
                    result.compileSuccess ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      result.compileSuccess ? 'bg-emerald-400' : 'bg-red-400'
                    )} />
                    <span>Compile {result.compileSuccess ? '✓' : '✗'}</span>
                    <span className="text-surface-muted opacity-75">({result.compileTime}ms)</span>
                  </div>

                  {/* Runtime Status */}
                  {result.compileSuccess && (
                    <div className={cn(
                      'text-xs font-medium flex items-center gap-1.5',
                      result.runtimeSuccess ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        result.runtimeSuccess ? 'bg-emerald-400' : 'bg-red-400'
                      )} />
                      <span>Runtime {result.runtimeSuccess ? '✓' : '✗'}</span>
                      <span className="text-surface-muted opacity-75">({result.executionTime}ms)</span>
                      {result.timedOut && <span className="text-orange-400">• Timeout</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compile Errors */}
            {result && !result.compileSuccess && result.stderr && (
              <div className="mb-3">
                <div className="text-xs font-medium text-red-400 mb-1.5">Compilation Error:</div>
                <div className="text-red-300/90 whitespace-pre-wrap break-words bg-red-950/20 p-2 rounded border border-red-900/30 text-[11px]">
                  {result.stderr}
                </div>
              </div>
            )}

            {/* Runtime Errors & Output */}
            {result && result.compileSuccess && (
              <div className="space-y-2.5">
                {/* Runtime Error */}
                {!result.runtimeSuccess && result.stderr && (
                  <div>
                    <div className="text-xs font-medium text-red-400 mb-1.5">Runtime Error:</div>
                    <div className="text-red-300/90 whitespace-pre-wrap break-words bg-red-950/20 p-2 rounded border border-red-900/30 text-[11px]">
                      {result.stderr}
                    </div>
                  </div>
                )}

                {/* Program Output */}
                {result.stdout && (
                  <div>
                    <div className="text-xs font-medium text-emerald-300 mb-1.5">Output:</div>
                    <div className="text-emerald-200/90 whitespace-pre-wrap break-words bg-emerald-950/20 p-2 rounded border border-emerald-900/30 text-[11px]">
                      {result.stdout}
                    </div>
                  </div>
                )}

                {/* Empty Output */}
                {result.runtimeSuccess && !result.stdout && (
                  <div className="text-surface-muted/50 text-[11px]">
                    (program produced no output)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoomPanel>
  );
}
