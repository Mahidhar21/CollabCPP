import { useState, useEffect, useRef, useCallback } from 'react';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

/**
 * useWhiteboard hook
 * Manages collaborative whiteboard drawing state and socket synchronization.
 *
 * Features:
 * - Local drawing with immediate visual feedback
 * - Remote drawing via socket events
 * - Throttled socket events to avoid spam
 * - Separate local/remote rendering
 * - Clean event subscription management
 */
export function useWhiteboard(roomId, isActive) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [brushSize, setBrushSize] = useState(3);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const { subscribe, emit } = useSocketStore();

  // Throttle config for socket events
  const lastEmitTimeRef = useRef(0);
  const THROTTLE_MS = 50; // Emit at most every 50ms

  // Initialize canvas context
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const context = canvas.getContext('2d');
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    contextRef.current = context;
  }, [isActive]);

  // Clear canvas locally
  const clearLocal = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  // Clear canvas and broadcast
  const clearCanvas = useCallback(() => {
    clearLocal();
    if (isActive && roomId) {
      emit(SOCKET_EVENTS.CLEAR_CANVAS, { roomId });
    }
  }, [clearLocal, isActive, roomId, emit]);

  // Draw line locally
  const drawLineLocal = useCallback(
    (x0, y0, x1, y1, options = {}) => {
      if (!contextRef.current) return;

      const context = contextRef.current;
      const size = options.size || brushSize;
      const opacity = options.opacity || 1;

      context.globalAlpha = opacity;
      context.strokeStyle = options.color || '#ffffff';
      context.lineWidth = size;

      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.stroke();
      context.globalAlpha = 1;
    },
    [brushSize]
  );

  // Erase locally
  const eraseLocal = useCallback((x0, y0, x1, y1, size = 15) => {
    if (!contextRef.current) return;

    const context = contextRef.current;
    context.clearRect(x0 - size / 2, y0 - size / 2, size, size);
    context.clearRect(x1 - size / 2, y1 - size / 2, size, size);

    // Draw eraser line by clearing
    const prevComposite = context.globalCompositeOperation;
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = size;
    context.strokeStyle = 'rgba(0,0,0,1)';

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();

    context.globalCompositeOperation = prevComposite;
  }, []);

  // Handle drawing start
  const startDrawing = useCallback(
    (e) => {
      if (!isActive) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      lastEmitTimeRef.current = Date.now();

      // Store initial position
      contextRef.current.startX = x;
      contextRef.current.startY = y;
    },
    [isActive]
  );

  // Handle drawing move
  const moveDrawing = useCallback(
    (e) => {
      if (!isDrawing || !isActive || !contextRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const x0 = contextRef.current.startX;
      const y0 = contextRef.current.startY;

      // Draw locally immediately
      if (tool === 'pen') {
        drawLineLocal(x0, y0, x, y, { opacity: 1 });
      } else if (tool === 'eraser') {
        eraseLocal(x0, y0, x, y, 15);
      }

      // Throttle socket events
      const now = Date.now();
      if (now - lastEmitTimeRef.current > THROTTLE_MS) {
        if (tool === 'pen') {
          emit(SOCKET_EVENTS.DRAW, { roomId, x, y, x0, y0, size: brushSize });
        } else if (tool === 'eraser') {
          emit(SOCKET_EVENTS.ERASE, { roomId, x, y, x0, y0, size: 15 });
        }
        lastEmitTimeRef.current = now;
      }

      // Update start position for next segment
      contextRef.current.startX = x;
      contextRef.current.startY = y;
    },
    [isDrawing, isActive, tool, roomId, emit, drawLineLocal, eraseLocal, brushSize]
  );

  // Handle drawing end
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Listen for remote draw events
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.DRAW, (data) => {
      drawLineLocal(data.x0, data.y0, data.x, data.y, {
        size: data.size,
        opacity: data.opacity,
      });
    });

    return () => {
      if (typeof unsubscriber === 'function') unsubscriber();
    };
  }, [isActive, roomId, subscribe, drawLineLocal]);

  // Listen for remote erase events
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.ERASE, (data) => {
      eraseLocal(data.x0, data.y0, data.x, data.y, data.size);
    });

    return () => {
      if (typeof unsubscriber === 'function') unsubscriber();
    };
  }, [isActive, roomId, subscribe, eraseLocal]);

  // Listen for clear canvas events
  useEffect(() => {
    if (!isActive || !roomId) return;

    const unsubscriber = subscribe(SOCKET_EVENTS.CLEAR_CANVAS, () => {
      clearLocal();
    });

    return () => {
      if (typeof unsubscriber === 'function') unsubscriber();
    };
  }, [isActive, roomId, subscribe, clearLocal]);

  // Attach mouse listeners to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', moveDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', moveDrawing);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [startDrawing, moveDrawing, stopDrawing]);

  return {
    canvasRef,
    tool,
    setTool,
    brushSize,
    setBrushSize,
    clearCanvas,
    isDrawing,
  };
}
