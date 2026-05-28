/**
 * Output Console Panel
 * Displays code execution results with styled terminal
 */

import React from 'react';
import { cn } from '../../utils/cn.js';
import RoomPanel from './RoomPanel.jsx';

export default function OutputPanel({ output, isExecuting, error }) {
  // Extract result from output object
  const result = output?.result;
  const executedBy = output?.executedBy;

  return (
    <RoomPanel 
      title="Output" 
      subtitle="Compile & run" 
      className="h-40 shrink-0" 
      bodyClassName="p-0 flex flex-col min-h-0"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-surface-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-muted">Console</span>
          {executedBy && (
            <span className="text-xs text-surface-muted opacity-75">
              by {executedBy.username}
            </span>
          )}
        </div>
        {isExecuting && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent-muted rounded-full animate-pulse" />
            <span className="text-xs text-surface-muted">Executing...</span>
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="flex-1 overflow-auto p-3 font-mono text-xs">
        {error && (
          <div className="text-red-400 whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {!result && !error && !isExecuting && (
          <div className="text-surface-muted">
            No output yet. Click "Run" to execute code.
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Compilation Status */}
            <div>
              <div className={cn(
                'text-xs font-medium mb-1 flex items-center gap-1.5',
                result.compileSuccess ? 'text-emerald-400' : 'text-red-400'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  result.compileSuccess ? 'bg-emerald-400' : 'bg-red-400'
                )} />
                Compilation {result.compileSuccess ? '✓' : '✗'} ({result.compileTime}ms)
              </div>
            </div>

            {/* Compile Error */}
            {!result.compileSuccess && result.stderr && (
              <div className="text-red-300/90 whitespace-pre-wrap break-words bg-red-950/20 p-2 rounded border border-red-900/30">
                {result.stderr}
              </div>
            )}

            {/* Runtime Status */}
            {result.compileSuccess && (
              <div>
                <div className={cn(
                  'text-xs font-medium mb-1 flex items-center gap-1.5',
                  result.runtimeSuccess ? 'text-emerald-400' : 'text-red-400'
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    result.runtimeSuccess ? 'bg-emerald-400' : 'bg-red-400'
                  )} />
                  Execution {result.runtimeSuccess ? '✓' : '✗'} ({result.executionTime}ms)
                  {result.timedOut && ' · Timeout'}
                </div>
              </div>
            )}

            {/* Runtime Error */}
            {result.compileSuccess && !result.runtimeSuccess && result.stderr && (
              <div className="text-red-300/90 whitespace-pre-wrap break-words bg-red-950/20 p-2 rounded border border-red-900/30">
                {result.stderr}
              </div>
            )}

            {/* Stdout */}
            {result.compileSuccess && result.stdout && (
              <div>
                <div className="text-emerald-300/90 whitespace-pre-wrap break-words bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                  {result.stdout}
                </div>
              </div>
            )}

            {/* Empty Output */}
            {result.compileSuccess && !result.stdout && result.runtimeSuccess && (
              <div className="text-surface-muted opacity-50">
                (no output)
              </div>
            )}
          </div>
        )}
      </div>
    </RoomPanel>
  );
}
