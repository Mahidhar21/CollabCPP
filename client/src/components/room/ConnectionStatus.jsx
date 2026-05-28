import { cn } from '../../utils/cn.js';

const statusConfig = {
  disconnected: { label: 'Offline', color: 'bg-surface-muted', pulse: false },
  connecting: { label: 'Connecting', color: 'bg-amber-400/80', pulse: true },
  connected: { label: 'Connected', color: 'bg-emerald-500/80', pulse: false },
  joining: { label: 'Joining room', color: 'bg-amber-400/80', pulse: true },
  joined: { label: 'Live', color: 'bg-emerald-500/80', pulse: true },
  error: { label: 'Error', color: 'bg-red-400/80', pulse: false },
  idle: { label: 'Idle', color: 'bg-surface-muted', pulse: false },
};

export default function ConnectionStatus({ connectionStatus, roomSocketStatus }) {
  const key =
    roomSocketStatus === 'joined'
      ? 'joined'
      : roomSocketStatus === 'joining'
        ? 'joining'
        : roomSocketStatus === 'error'
          ? 'error'
          : connectionStatus;

  const config = statusConfig[key] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-overlay px-2.5 py-1">
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          config.color,
          config.pulse && 'animate-pulse'
        )}
      />
      <span className="font-mono text-[10px] uppercase tracking-wider text-accent-dim">
        {config.label}
      </span>
    </div>
  );
}
