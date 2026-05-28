/**
 * PanelHeader Component
 * 
 * Reusable panel header with title, icon, and action buttons.
 * Used for ChatPanel, WhiteboardPanel, ParticipantsPanel headers.
 */

import React from 'react';
import { cn } from '../../utils/cn.js';

export function PanelHeader({
  title,
  icon: Icon,
  onToggle,
  onFullscreen,
  isFullscreen = false,
  isCollapsed = false,
  actions = [],
  className = '',
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2 px-3 py-2 border-b border-surface-border', className)}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-highlight" />}
        <h3 className="text-xs font-semibold text-accent truncate">{title}</h3>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            title={action.title}
            className={cn(
              'p-1 rounded transition-colors',
              'hover:bg-surface-border/60 active:bg-surface-border',
              'text-accent-dim hover:text-accent',
              action.className
            )}
          >
            {action.icon && <action.icon className="h-3.5 w-3.5" />}
            {action.label && <span className="text-xs">{action.label}</span>}
          </button>
        ))}

        {onFullscreen && (
          <button
            onClick={onFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1 rounded transition-colors hover:bg-surface-border/60 active:bg-surface-border text-accent-dim hover:text-accent"
          >
            {isFullscreen ? (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        )}

        {onToggle && (
          <button
            onClick={onToggle}
            title={isCollapsed ? 'Show' : 'Collapse'}
            className="p-1 rounded transition-colors hover:bg-surface-border/60 active:bg-surface-border text-accent-dim hover:text-accent"
          >
            <svg
              className={cn('h-3.5 w-3.5 transition-transform', isCollapsed ? 'rotate-180' : '')}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
