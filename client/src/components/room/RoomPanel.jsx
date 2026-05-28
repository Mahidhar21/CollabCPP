import { cn } from '../../utils/cn.js';

export default function RoomPanel({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  badge,
}) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-raised',
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-surface-border px-3 py-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-accent-dim">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-accent-dim">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className="font-mono text-[10px] text-accent-dim">{badge}</span>
        )}
      </header>
      <div className={cn('min-h-0 flex-1 overflow-auto', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
