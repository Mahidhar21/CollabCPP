/**
 * useSession Hook
 * 
 * Manages session persistence:
 * - Load existing session state on room join
 * - Emit persistence events (debounced on backend)
 * - Track save status (saving, saved, error)
 * - Fetch recent sessions for user
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function useSession(roomId, isActive) {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);

  const { emit, subscribe } = useSocketStore();

  /**
   * Load session on room join
   */
  useEffect(() => {
    if (!isActive || !roomId) return;

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/sessions/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setSessionData(result.data);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [isActive, roomId]);

  /**
   * Emit debounced code persistence event
   * Backend will batch saves every 5 seconds
   */
  const persistCode = useCallback(
    (code) => {
      if (!roomId) return;
      emit(SOCKET_EVENTS.SESSION_CODE_CHANGE, {
        roomId,
        code,
      });
    },
    [roomId, emit]
  );

  /**
   * Emit chat message persistence event
   * Backend will batch saves every 10 seconds
   */
  const persistChatMessage = useCallback(
    (message, senderId, senderName) => {
      if (!roomId) return;
      emit(SOCKET_EVENTS.SESSION_MESSAGE_ADD, {
        roomId,
        message: {
          senderId,
          senderName,
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      });
    },
    [roomId, emit]
  );

  /**
   * Emit whiteboard action persistence event
   * Backend will batch saves every 10 seconds
   */
  const persistWhiteboardAction = useCallback(
    (action) => {
      if (!roomId) return;
      emit(SOCKET_EVENTS.SESSION_WHITEBOARD_ACTION, {
        roomId,
        action: {
          type: action.type, // DRAW, ERASE, CLEAR
          x: action.x,
          y: action.y,
          x0: action.x0,
          y0: action.y0,
          size: action.size,
          timestamp: action.timestamp || new Date().toISOString(),
        },
      });
    },
    [roomId, emit]
  );

  /**
   * Manual session save (called on room leave or major events)
   */
  const saveSession = useCallback(
    async (data) => {
      if (!roomId) return;

      setSaveStatus('saving');

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/sessions/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomId,
            title: data.title,
            owner: data.owner,
            participants: data.participants,
            currentCode: data.currentCode,
            chatHistory: data.chatHistory,
            whiteboardData: data.whiteboardData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save session');
        }

        const result = await response.json();
        if (result.success) {
          setSaveStatus('saved');
          setLastSaved(new Date());

          // Reset status after 3 seconds
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          throw new Error(result.message || 'Save failed');
        }
      } catch (err) {
        console.error('Error saving session:', err);
        setSaveStatus('error');
        setError(err.message);

        // Reset error status after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle');
          setError(null);
        }, 5000);
      }
    },
    [roomId]
  );

  return {
    sessionData,
    loading,
    error,
    saveStatus,
    lastSaved,
    persistCode,
    persistChatMessage,
    persistWhiteboardAction,
    saveSession,
  };
}

/**
 * Hook to fetch recent sessions for current user
 */
export function useRecentSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentSessions = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/sessions/recent?limit=10`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const result = await response.json();
        if (result.success) {
          setSessions(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching recent sessions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  return { sessions, loading, error };
}
