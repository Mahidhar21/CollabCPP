import { useCallback, useEffect, useRef, useState } from 'react';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';
import { emitJoinRoom, emitLeaveRoom, getSocket } from '../sockets/socketClient.js';
import useAuthStore from '../store/useAuthStore.js';
import useSocketStore from '../store/useSocketStore.js';
import { getStoredToken } from '../utils/token.js';

export function useRoomSocket(roomId, enabled = false) {
  const storeToken = useAuthStore((s) => s.token);
  const isAuthReady = useAuthStore((s) => s.isInitialized);
  const token = storeToken || getStoredToken();
  const status = useSocketStore((s) => s.status);
  const connect = useSocketStore((s) => s.connect);
  const subscribe = useSocketStore((s) => s.subscribe);

  const [liveParticipants, setLiveParticipants] = useState([]);
  const [roomSocketStatus, setRoomSocketStatus] = useState('idle');
  const [roomError, setRoomError] = useState(null);
  const joinedRef = useRef(false);

  const dedupeByUserId = useCallback((list) => {
    const map = new Map();
    list.forEach((p) => map.set(p.userId, { ...p, online: true }));
    return Array.from(map.values());
  }, []);

  const mergeParticipant = useCallback((list, participant) => {
    const exists = list.some(
      (p) => p.userId === participant.userId || p.socketId === participant.socketId
    );
    if (exists) {
      return list.map((p) =>
        p.userId === participant.userId ? { ...p, ...participant, online: true } : p
      );
    }
    return [...list, { ...participant, online: true }];
  }, []);

  useEffect(() => {
    if (!enabled || !token || !roomId || !isAuthReady) return undefined;

    connect(token);
    joinedRef.current = false;
    setRoomSocketStatus('connecting');
    setRoomError(null);

    const unsubSync = subscribe(SOCKET_EVENTS.PARTICIPANTS_SYNC, (data) => {
      if (data.roomId?.toUpperCase() !== roomId.toUpperCase()) return;
      setLiveParticipants(dedupeByUserId(data.participants || []));
      setRoomSocketStatus('joined');
      joinedRef.current = true;
    });

    const unsubJoined = subscribe(SOCKET_EVENTS.PARTICIPANT_JOINED, (data) => {
      if (data.roomId?.toUpperCase() !== roomId.toUpperCase()) return;
      setLiveParticipants((prev) =>
        dedupeByUserId(mergeParticipant(prev, data.participant))
      );
    });

    const unsubLeft = subscribe(SOCKET_EVENTS.PARTICIPANT_LEFT, (data) => {
      if (data.roomId?.toUpperCase() !== roomId.toUpperCase()) return;
      setLiveParticipants((prev) =>
        prev.filter((p) => p.socketId !== data.participant?.socketId)
      );
    });

    const unsubError = subscribe(SOCKET_EVENTS.ROOM_ERROR, (data) => {
      setRoomError(data.message || 'Room error');
      setRoomSocketStatus('error');
    });

    const attemptJoin = async () => {
      if (joinedRef.current) return;
      setRoomSocketStatus('joining');
      try {
        await emitJoinRoom(roomId.toUpperCase());
        joinedRef.current = true;
        setRoomSocketStatus('joined');
        setRoomError(null);
      } catch (err) {
        setRoomSocketStatus('error');
        setRoomError(err.message);
      }
    };

    const socket = getSocket();
    let onConnectHandler = null;

    if (socket) {
      onConnectHandler = () => {
        joinedRef.current = false;
        attemptJoin();
      };
      socket.on('connect', onConnectHandler);
      if (socket.connected) attemptJoin();
    }

    return () => {
      if (socket && onConnectHandler) {
        socket.off('connect', onConnectHandler);
      }
      unsubSync();
      unsubJoined();
      unsubLeft();
      unsubError();

      if (joinedRef.current) {
        emitLeaveRoom(roomId.toUpperCase()).catch(() => {});
        joinedRef.current = false;
      }

      setLiveParticipants([]);
      setRoomSocketStatus('idle');
    };
  }, [enabled, token, roomId, isAuthReady, connect, subscribe, mergeParticipant, dedupeByUserId]);

  return {
    liveParticipants,
    connectionStatus: status,
    roomSocketStatus,
    roomError,
    isConnected: status === 'connected',
    isJoined: roomSocketStatus === 'joined',
  };
}
