import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore.js';

export default function AuthInitializer({ children }) {
  const { isInitialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-muted border-t-brand-highlight" />
          <p className="text-sm text-accent-dim">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return children;
}
