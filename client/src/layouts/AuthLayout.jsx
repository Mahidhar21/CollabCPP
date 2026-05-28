import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            to="/"
            className="text-sm text-accent-muted transition-colors hover:text-accent"
          >
            ← Back to home
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
