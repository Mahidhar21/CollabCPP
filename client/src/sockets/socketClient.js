import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from './socketEvents.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let connectionToken = null;

/**
 * Singleton Socket.IO client.
 * One connection per session; room membership is managed via join_room / leave_room.
 */
export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return socket?.connected ?? false;
}

export function connectSocket(token) {
  if (!token) {
    throw new Error('Token required for socket connection');
  }

  if (socket?.connected && connectionToken === token) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  connectionToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectionToken = null;
}

/**
 * Registers a one-time listener; returns unsubscribe function to prevent leaks.
 */
export function onSocketEvent(event, handler) {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => {
    socket?.off(event, handler);
  };
}

export function emitJoinRoom(roomId) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId }, (response) => {
      if (response?.success) resolve(response);
      else reject(new Error(response?.message || 'Failed to join room'));
    });
  });
}

export function emitLeaveRoom(roomId) {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ success: true });
      return;
    }

    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId }, (response) => {
      resolve(response ?? { success: true });
    });
  });
}

/**
 * Generic emit method for socket events
 * @param {string} event - Event name
 * @param {*} data - Event data
 * @param {Function} callback - Optional callback/ack handler
 */
export function emitEvent(event, data, callback) {
  if (!socket?.connected) {
    if (callback) callback({ success: false, message: 'Socket not connected' });
    return;
  }

  if (callback) {
    socket.emit(event, data, callback);
  } else {
    socket.emit(event, data);
  }
}

export { SOCKET_EVENTS };
