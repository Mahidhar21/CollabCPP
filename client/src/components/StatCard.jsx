import Card from './ui/Card.jsx';
import Badge from './ui/Badge.jsx';
import { cn } from '../utils/cn.js';

export default function StatCard({
  label,
  value,
  hint,
  badge,
  badgeVariant = 'default',
  loading,
  className,
}) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-accent-muted">{label}</p>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-md bg-surface-overlay" />
      ) : (
        <p className="font-mono text-2xl font-medium tracking-tight text-brand-highlight">
          {value ?? '—'}
        </p>
      )}
      {hint && <p className="text-xs text-accent-dim">{hint}</p>}
    </Card>
  );
}
