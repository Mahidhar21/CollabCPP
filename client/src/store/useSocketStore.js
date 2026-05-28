import { create } from 'zustand';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  onSocketEvent,
  emitEvent,
} from '../sockets/socketClient.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

const useSocketStore = create((set, get) => ({
  status: 'disconnected',
  socketId: null,
  error: null,

  connect: (token) => {
    if (!token) return;

    const current = get().status;
    if (current === 'connected' && isSocketConnected()) return;

    set({ status: 'connecting', error: null });

    const socket = connectSocket(token);

    const onConnect = () => {
      set({
        status: 'connected',
        socketId: socket.id,
        error: null,
      });
    };

    const onDisconnect = () => {
      set({ status: 'disconnected', socketId: null });
    };

    const onConnectError = (err) => {
      set({
        status: 'error',
        error: err.message || 'Connection failed',
        socketId: null,
      });
    };

    const onAck = (data) => {
      set({ socketId: data.socketId ?? socket.id });
    };

    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('connect_error', onConnectError);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.CONNECTION_ACK, onAck);

    if (socket.connected) {
      onConnect();
    }
  },

  disconnect: () => {
    const socket = getSocket();
    if (socket) {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(SOCKET_EVENTS.CONNECTION_ACK);
    }
    disconnectSocket();
    set({ status: 'disconnected', socketId: null, error: null });
  },

  subscribe: (event, handler) => onSocketEvent(event, handler),

  emit: (event, data, callback) => emitEvent(event, data, callback),

  socketClient: getSocket,
}));

export default useSocketStore;
