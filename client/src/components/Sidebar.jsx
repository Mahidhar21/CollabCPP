import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn.js';
import Logo from './Logo.jsx';
import Button from './ui/Button.jsx';
import useAppStore from '../store/useAppStore.js';
import useAuthStore from '../store/useAuthStore.js';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: '◫' },
  { to: '/dashboard', label: 'Sessions', icon: '◇' },
  { to: '/dashboard', label: 'Problems', icon: '▤', disabled: true },
  { to: '/dashboard', label: 'Settings', icon: '⚙', disabled: true },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-surface-border bg-surface-raised transition-all duration-300',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center border-b border-surface-border px-3">
        <Logo showText={sidebarOpen} />
      </div>

      {sidebarOpen && user && (
        <div className="border-b border-surface-border px-4 py-3">
          <p className="truncate text-sm font-medium text-brand-highlight">
            {user.username}
          </p>
          <p className="truncate text-xs text-accent-dim">{user.email}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.label === 'Overview'}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                item.disabled
                  ? 'cursor-not-allowed opacity-40'
                  : 'hover:bg-white/5',
                isActive && !item.disabled
                  ? 'bg-white/5 text-brand-highlight'
                  : 'text-accent-muted'
              )
            }
          >
            <span className="font-mono text-xs w-4 text-center">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
            {sidebarOpen && item.disabled && (
              <span className="ml-auto font-mono text-[10px] text-accent-dim">
                soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-surface-border p-2">
        {sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-accent-dim"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg py-2 text-xs text-accent-dim transition-colors hover:bg-white/5 hover:text-accent"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '← Collapse' : '→'}
        </button>
      </div>
    </aside>
  );
}
