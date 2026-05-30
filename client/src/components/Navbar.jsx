import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import Button from './ui/Button.jsx';
import { cn } from '../utils/cn.js';
import useAuthStore from '../store/useAuthStore.js';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border/80 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {/* no center nav links */}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden font-mono text-xs text-accent-dim sm:inline">
                @{user?.username}
              </span>
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
