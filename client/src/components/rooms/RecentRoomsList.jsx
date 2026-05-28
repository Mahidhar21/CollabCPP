import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../auth/Spinner.jsx';

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function RecentRoomsList({ rooms, loading, error, onRefresh }) {
  if (loading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <Spinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <p className="text-sm text-red-400">{error}</p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-sm text-accent-muted transition-colors hover:text-accent"
          >
            Try again
          </button>
        )}
      </Card>
    );
  }

  if (rooms.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm text-accent-muted">No sessions yet</p>
        <p className="mt-1 text-xs text-accent-dim">
          Create a room or join one with a shared ID.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <Link
          key={room.roomId}
          to={`/room/${room.roomId}`}
          className={cn(
            'group flex items-center justify-between gap-4 rounded-xl border border-surface-border',
            'bg-surface-raised px-4 py-3.5 shadow-soft transition-all duration-200',
            'hover:border-surface-muted hover:bg-surface-overlay hover:shadow-card'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-brand-highlight transition-colors group-hover:text-white">
              {room.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-accent-dim">{room.roomId}</span>
              <span className="text-xs text-accent-dim">·</span>
              <span className="text-xs text-accent-dim">
                {room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {room.isOwner && <Badge variant="default">Owner</Badge>}
            <span className="text-xs text-accent-dim">
              {formatRelativeTime(room.updatedAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
