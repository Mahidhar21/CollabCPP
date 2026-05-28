import { useState, useEffect, useCallback } from 'react';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

export function useChat(roomId, isActive) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const { subscribe, emit } = useSocketStore();

  // Load chat history when room is joined
  useEffect(() => {
    if (!isActive || !roomId) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        emit(
          SOCKET_EVENTS.GET_CHAT_HISTORY,
          { roomId },
          (response) => {
            if (response?.success) {
              setMessages(response.messages || []);
            } else {
              setError(response?.error || 'Failed to load chat history');
            }
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadHistory();
  }, [isActive, roomId, emit]);

  // Listen for incoming messages
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.RECEIVE_MESSAGE, (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    };
  }, [isActive, roomId, subscribe]);

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim() || !roomId) return;

      setIsSending(true);

      try {
        emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          { roomId, message: message.trim() },
          (response) => {
            if (!response?.success) {
              setError(response?.error || 'Failed to send message');
            }
            setIsSending(false);
          }
        );
      } catch (err) {
        setError(err.message);
        setIsSending(false);
      }
    },
    [roomId, emit]
  );

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage,
  };
}
