import { useMemo } from 'react';
import { cn } from '../../utils/cn.js';
import RoomPanel from './RoomPanel.jsx';
import useAuthStore from '../../store/useAuthStore.js';

/**
 * ParticipantsPanel
 * Displays:
 * - Active online participants in the room
 * - Current user highlighted
 * - Join/leave timestamps
 * - Online status indicators
 */
export default function ParticipantsPanel({
  participants = [],
  isLoading = false,
  error = null,
}) {
  const { user } = useAuthStore();

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      // Current user first
      if (a.userId === user?.id) return -1;
      if (b.userId === user?.id) return 1;
      // Then by join timestamp (oldest first)
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });
  }, [participants, user?.id]);

  const formatJoinTime = (timestamp) => {
    const now = new Date();
    const joined = new Date(timestamp);
    const diffMinutes = Math.floor((now - joined) / (1000 * 60));

    if (diffMinutes === 0) return 'just now';
    if (diffMinutes === 1) return '1m ago';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;

    return joined.toLocaleDateString();
  };

  return (
    <RoomPanel
      title="Participants"
      subtitle="Realtime presence"
      badge={`${sortedParticipants.length} online`}
      className="shrink-0"
    >
      <div className="flex h-full min-h-[120px] flex-col gap-2">
        {isLoading && sortedParticipants.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-accent-dim">Loading participants…</p>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        ) : sortedParticipants.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-accent-dim">No participants</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {sortedParticipants.map((participant) => {
              const isCurrentUser = participant.userId === user?.id;

              return (
                <div
                  key={participant.socketId}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors',
                    isCurrentUser
                      ? 'bg-surface-border/50 border border-accent/20'
                      : 'bg-surface-overlay hover:bg-surface-border/30'
                  )}
                >
                  {/* Online indicator */}
                  <div className="relative h-2 w-2 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse" />
                    <div className="absolute inset-0.5 rounded-full bg-green-500" />
                  </div>

                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {participant.username}
                      </p>
                      {isCurrentUser && (
                        <span className="shrink-0 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-accent-dim">
                      {formatJoinTime(participant.joinedAt)}
                    </p>
                  </div>

                  {/* Activity indicator (pulsing dot for non-current user) */}
                  {!isCurrentUser && (
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent opacity-60" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoomPanel>
  );
}
