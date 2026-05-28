import { cn } from '../../utils/cn.js';

export default function Input({
  label,
  id,
  type = 'text',
  error,
  className,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-accent-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={cn(
          'w-full rounded-lg border bg-surface-overlay px-3.5 py-2.5 text-sm text-accent',
          'border-surface-border placeholder:text-accent-dim',
          'transition-all duration-200',
          'hover:border-surface-muted',
          'focus:border-surface-muted focus:outline-none focus:ring-2 focus:ring-white/10',
          error && 'border-red-500/50 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
