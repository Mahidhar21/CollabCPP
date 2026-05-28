import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import useAuthStore from '../store/useAuthStore.js';

export default function AppLayout() {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-surface-border px-6">
          <h1 className="text-sm font-medium text-accent-muted">Workspace</h1>
          {user && (
            <span className="font-mono text-xs text-accent-dim">
              {user.email}
            </span>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
