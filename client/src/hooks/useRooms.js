import { useCallback, useEffect, useState } from 'react';
import { roomsApi } from '../services/api.js';

export function useRecentRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await roomsApi.getRecent();
      setRooms(data.data.rooms);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return { rooms, loading, error, refetch: fetchRecent };
}

export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessReady, setAccessReady] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    setAccessReady(false);

    try {
      const { data } = await roomsApi.getById(roomId);
      setRoom(data.data.room);
      setAccessReady(true);
    } catch (err) {
      if (err.status === 403) {
        try {
          await roomsApi.join({ roomId });
          const { data } = await roomsApi.getById(roomId);
          setRoom(data.data.room);
          setAccessReady(true);
          return;
        } catch (joinErr) {
          setError(joinErr.message || 'Could not join room');
        }
      } else {
        setError(err.message || 'Failed to load room');
      }
      setRoom(null);
      setAccessReady(false);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  return { room, loading, error, refetch: fetchRoom, accessReady };
}
