import { cn } from '../../utils/cn.js';

const variants = {
  primary:
    'bg-brand-highlight text-surface hover:bg-white/90 shadow-soft',
  secondary:
    'bg-surface-overlay text-accent border border-surface-border hover:bg-surface-muted/30 shadow-soft',
  ghost:
    'text-accent-muted hover:text-accent hover:bg-white/5',
  outline:
    'border border-surface-border text-accent hover:border-surface-muted hover:bg-surface-overlay/50',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:focus-ring',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
