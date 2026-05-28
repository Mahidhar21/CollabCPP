import { Link } from 'react-router-dom';
import { cn } from '../utils/cn.js';

export default function Logo({ className, showText = true }) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90',
        className
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-overlay shadow-soft transition-colors duration-200 group-hover:border-surface-muted">
        <span className="font-mono text-sm font-medium text-brand-highlight">
          C+
        </span>
      </span>
      {showText && (
        <span className="text-sm font-semibold tracking-tight text-brand-highlight">
          CollabCPP
        </span>
      )}
    </Link>
  );
}
