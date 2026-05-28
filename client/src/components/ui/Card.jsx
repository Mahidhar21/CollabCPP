import { cn } from '../../utils/cn.js';

export default function Card({ children, className, hover = false }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-border bg-surface-raised p-6 shadow-card',
        'transition-all duration-200',
        hover && 'hover:border-surface-muted hover:shadow-elevated',
        className
      )}
    >
      {children}
    </div>
  );
}
