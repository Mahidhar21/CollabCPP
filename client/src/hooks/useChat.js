import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore.js';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

export function useChat(roomId, isActive) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const { subscribe, emit } = useSocketStore();
  const user = useAuthStore((s) => s.user);

  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.messageId === message.messageId)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const removePendingMessage = useCallback((messageId) => {
    setMessages((prev) => prev.filter((item) => item.messageId !== messageId));
  }, []);

  const mergeIncomingMessage = useCallback((message) => {
    setMessages((prev) => {
      const duplicateIndex = prev.findIndex(
        (item) =>
          item.messageId === message.messageId ||
          (item.pending && item.userId === message.userId && item.message === message.message)
      );

      if (duplicateIndex !== -1) {
        return prev.map((item, index) =>
          index === duplicateIndex ? { ...item, ...message, pending: false } : item
        );
      }

      return [...prev, message];
    });
  }, []);

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
        mergeIncomingMessage(data);
      }
    });

    return () => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    };
  }, [isActive, roomId, subscribe, mergeIncomingMessage]);

  const sendMessage = useCallback(
    async (message) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || !roomId) return;

      setError(null);
      setIsSending(true);

      const pendingMessage = {
        messageId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        roomId,
        userId: user?.id ?? 'unknown',
        username: user?.username ?? 'You',
        senderId: user?.id ?? 'unknown',
        senderName: user?.username ?? 'You',
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        pending: true,
      };

      addMessage(pendingMessage);

      try {
        emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          { roomId, message: trimmedMessage },
          (response) => {
            if (!response?.success) {
              removePendingMessage(pendingMessage.messageId);
              setError(response?.error || 'Failed to send message');
            }
            setIsSending(false);
          }
        );
      } catch (err) {
        removePendingMessage(pendingMessage.messageId);
        setError(err.message);
        setIsSending(false);
      }
    },
    [roomId, emit, user, addMessage, removePendingMessage]
  );

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage,
  };
}
