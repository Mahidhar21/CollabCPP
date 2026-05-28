import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../auth/Input.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../auth/Spinner.jsx';
import { roomsApi } from '../../services/api.js';

export default function JoinRoomForm({ onJoined, compact = false }) {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomId.trim()) {
      setError('Enter a room ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await roomsApi.join({ roomId: roomId.trim() });
      const room = data.data.room;
      onJoined?.(room);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      const messages = err.data?.errors;
      setError(Array.isArray(messages) ? messages.join('. ') : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'flex flex-col gap-3 sm:flex-row sm:items-end' : 'space-y-4'}>
      {error && !compact && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className={compact ? 'min-w-0 flex-1' : ''}>
        <Input
          id="join-room-id"
          label={compact ? undefined : 'Room ID'}
          placeholder="cpp-7F3K2A"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          className="font-mono uppercase"
          error={compact ? undefined : error}
        />
        {compact && error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>

      <Button type="submit" variant="secondary" disabled={loading} className={compact ? 'shrink-0' : 'w-full'}>
        {loading ? (
          <>
            <Spinner size="sm" />
            Joining...
          </>
        ) : (
          'Join room'
        )}
      </Button>
    </form>
  );
}
