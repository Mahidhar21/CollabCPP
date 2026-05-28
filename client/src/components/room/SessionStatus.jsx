/**
 * SessionStatus Component
 * 
 * Subtle, unobtrusive indicator of session persistence status.
 * Shows: saving... | saved | error
 * 
 * Positioned discreetly in the UI, appears/disappears smoothly.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn.js';

export function SessionStatus({ status = 'idle', lastSaved = null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);

      if (status === 'saved' || status === 'error') {
        const timer = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!visible) {
    return null;
  }

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 animate-spin rounded-full border-2 border-brand-highlight border-t-transparent" />
            <span className="text-xs text-accent-dim">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs text-emerald-600">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span className="text-xs text-red-600">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 rounded-lg px-3 py-2',
        'bg-surface-overlay border border-surface-border',
        'shadow-lg transition-all duration-300 ease-out',
        'animate-fade-in'
      )}
    >
      {getStatusContent()}
    </div>
  );
}
