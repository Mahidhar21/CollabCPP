import { useEffect } from 'react';
import { cn } from '../../utils/cn.js';

export default function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full max-w-md animate-slide-up rounded-xl border border-surface-border',
          'bg-surface-raised p-6 shadow-elevated',
          className
        )}
      >
        {title && (
          <h2
            id="modal-title"
            className="mb-6 text-lg font-semibold tracking-tight text-brand-highlight"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
