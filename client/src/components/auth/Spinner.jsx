import { cn } from '../../utils/cn.js';

export default function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-2',
  };

  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-surface-muted border-t-brand-highlight',
        sizes[size],
        className
      )}
      aria-hidden="true"
    />
  );
}
