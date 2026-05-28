import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import CreateRoomModal from '../components/rooms/CreateRoomModal.jsx';
import JoinRoomForm from '../components/rooms/JoinRoomForm.jsx';
import RecentRoomsList from '../components/rooms/RecentRoomsList.jsx';
import RecentSessionsList from '../components/rooms/RecentSessionsList.jsx';
import { useRecentRooms } from '../hooks/useRooms.js';
import { useRecentSessions } from '../hooks/useSession.js';
import useAuthStore from '../store/useAuthStore.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { rooms, loading, error, refetch } = useRecentRooms();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useRecentSessions();
  const [createOpen, setCreateOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-brand-highlight">
            Welcome back, {user?.username}
          </h2>
          <p className="mt-1 text-sm text-accent-muted">
            Create or join an interview room to start collaborating.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0 self-start">
          Sign out
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card hover className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-medium text-brand-highlight">New session</h3>
            <p className="mt-1 text-sm text-accent-muted">
              Start a C++ interview room and invite participants.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create room</Button>
        </Card>

        <Card>
          <h3 className="mb-4 font-medium text-brand-highlight">Join session</h3>
          <JoinRoomForm onJoined={refetch} compact />
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-accent-muted">Recent sessions</h3>
          <button
            type="button"
            onClick={refetch}
            className="text-xs text-accent-dim transition-colors hover:text-accent"
          >
            Refresh
          </button>
        </div>
        <RecentSessionsList
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
        />
      </section>

      <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
    </div>
  );
}
