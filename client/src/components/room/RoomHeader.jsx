import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import ConnectionStatus from './ConnectionStatus.jsx';
import useAuthStore from '../../store/useAuthStore.js';
import { cn } from '../../utils/cn.js';

export default function RoomHeader({
  room,
  onCopyId,
  connectionStatus,
  roomSocketStatus,
  roomError,
}) {
  const { logout } = useAuthStore();

  const handleCopy = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      onCopyId?.();
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-surface-border bg-surface-raised/40 backdrop-blur-xl px-4 transition-all duration-200">
      {/* Left section: Navigation + Title */}
      <div className="flex min-w-0 items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 shrink-0 text-xs text-accent-muted transition-all hover:text-brand-highlight hover:gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="truncate text-sm font-semibold text-brand-highlight">
              {room?.title || 'Interview Room'}
            </h1>
            {room?.isOwner && (
              <Badge variant="default" className="shrink-0">Owner</Badge>
            )}
          </div>
        </div>

        {/* Room ID copy button */}
        {room?.roomId && (
          <button
            type="button"
            onClick={handleCopy}
            title="Copy room ID"
            className={cn(
              'hidden sm:flex items-center gap-1.5 shrink-0 rounded-lg',
              'px-2.5 py-1.5 font-mono text-xs',
              'border border-surface-border/60 bg-surface-overlay/50',
              'text-accent-dim hover:text-accent hover:border-surface-border hover:bg-surface-overlay',
              'transition-all duration-200 active:scale-95'
            )}
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
            <span className="hidden md:inline">{room.roomId}</span>
          </button>
        )}
      </div>

      {/* Right section: Status + Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <ConnectionStatus
            connectionStatus={connectionStatus}
            roomSocketStatus={roomSocketStatus}
          />
        </div>

        {/* Error indicator */}
        {roomError && (
          <div
            title={roomError}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 truncate max-w-[150px]">{roomError}</span>
          </div>
        )}

        {/* Sign out button */}
        <Button variant="ghost" size="sm" onClick={logout} className="shrink-0">
          Sign out
        </Button>
      </div>
    </header>
  );
}
