import { useState, useEffect, useCallback } from 'react';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

/**
 * usePresence hook
 * Manages realtime participant presence state for a room.
 * Features:
 * - Load participants on room join
 * - Listen for join/leave events
 * - Track participant list
 * - Prevent stale state
 */
export function usePresence(roomId, isActive) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { subscribe, emit } = useSocketStore();

  // Load initial participant list when joining room
  useEffect(() => {
    if (!isActive || !roomId) return;

    setLoading(true);
    setError(null);

    try {
      emit(
        SOCKET_EVENTS.GET_PRESENCE_STATUS,
        { roomId },
        (response) => {
          if (response?.success) {
            setParticipants(response.participants || []);
          } else {
            setError(response?.error || 'Failed to load presence');
          }
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [isActive, roomId, emit]);

  // Listen for PARTICIPANTS_SYNC broadcasts (full sync after join/leave)
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.PARTICIPANTS_SYNC, (data) => {
      if (data.roomId === roomId) {
        setParticipants(data.participants || []);
      }
    });

    return () => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    };
  }, [isActive, roomId, subscribe]);

  // Listen for PARTICIPANT_JOINED events (someone new joined)
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.PARTICIPANT_JOINED, (data) => {
      if (data.roomId === roomId) {
        // Add participant if not already present
        setParticipants((prev) => {
          const exists = prev.some((p) => p.socketId === data.participant.socketId);
          if (exists) return prev;
          return [...prev, data.participant];
        });
      }
    });

    return () => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    };
  }, [isActive, roomId, subscribe]);

  // Listen for PARTICIPANT_LEFT events (someone left)
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.PARTICIPANT_LEFT, (data) => {
      if (data.roomId === roomId) {
        // Remove participant
        setParticipants((prev) =>
          prev.filter((p) => p.socketId !== data.participant.socketId)
        );
      }
    });

    return () => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    };
  }, [isActive, roomId, subscribe]);

  const getParticipantCount = useCallback(() => {
    return participants.length;
  }, [participants]);

  const isParticipantOnline = useCallback(
    (userId) => {
      return participants.some((p) => p.userId === userId);
    },
    [participants]
  );

  const getParticipantByUserId = useCallback(
    (userId) => {
      return participants.find((p) => p.userId === userId) || null;
    },
    [participants]
  );

  return {
    participants,
    loading,
    error,
    count: participants.length,
    getParticipantCount,
    isParticipantOnline,
    getParticipantByUserId,
  };
}
