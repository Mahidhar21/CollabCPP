/**
 * RecentSessionsList Component
 * 
 * Displays recent persisted sessions with:
 * - Last active timestamp
 * - Room title
 * - Owner/creator info
 * - Quick join button
 * - Estimated messages/activity count
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Spinner from '../auth/Spinner.jsx';
import { cn } from '../../utils/cn.js';

function formatTimeAgo(date) {
  if (!date) return 'Unknown';

  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export default function RecentSessionsList({ sessions = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-surface-border bg-surface-overlay py-8">
        <div className="flex flex-col items-center gap-2">
          <Spinner />
          <p className="text-xs text-accent-dim">Loading sessions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
        <p className="text-sm text-red-400">Failed to load sessions</p>
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface-overlay/50 px-4 py-8 text-center">
        <p className="text-sm text-accent-dim">No recent sessions yet</p>
        <p className="mt-1 text-xs text-accent-muted">Create or join a room to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Card key={session.roomId} hover className="flex items-center justify-between gap-4 p-3">
          <div className="min-w-0 flex-1">
            <Link
              to={`/room/${session.roomId}`}
              className="block text-sm font-medium text-brand-highlight hover:underline"
            >
              {session.title || 'Untitled Session'}
            </Link>
            <div className="mt-1 flex items-center gap-3 text-xs text-accent-muted">
              <span>
                {session.owner?.username || 'Unknown'} {session.owner?.username === 'you' ? '' : '• Owner'}
              </span>
              <span>Last active {formatTimeAgo(session.lastActive)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-surface-border/50 px-2 py-1">
              <svg
                className="h-3 w-3 text-accent-dim"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15 13H9v-2h6v2zm0 6H9v-2h6v2zm0-10H9V7h6v2zM21 4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
              </svg>
              <span className="text-xs font-medium text-accent-dim">
                {session.participants?.length || 0}
              </span>
            </div>

            <Link to={`/room/${session.roomId}`}>
              <Button variant="secondary" size="xs">
                Join
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
