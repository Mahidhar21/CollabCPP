/**
 * Code Execution Hook
 * Manages code execution lifecycle and output state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import useSocketStore from '../store/useSocketStore.js';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';

export function useCodeExecution(roomId, enabled = true) {
  const [executionOutput, setExecutionOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  
  const unsubscribersRef = useRef([]);
  const subscribe = useSocketStore((state) => state.subscribe);
  const emit = useSocketStore((state) => state.emit);

  // Execute code via socket
  const executeCode = useCallback(
    (code) => {
      if (!enabled) {
        setExecutionError('Execution not available');
        return;
      }

      setIsExecuting(true);
      setExecutionError(null);

      emit(
        SOCKET_EVENTS.EXECUTE_CODE,
        { roomId, code },
        (ack) => {
          if (!ack?.success) {
            setExecutionError(ack?.message || 'Failed to execute code');
            setIsExecuting(false);
          }
          // Output will come via EXECUTION_OUTPUT event
        }
      );
    },
    [emit, roomId, enabled]
  );

  // Listen for execution results
  useEffect(() => {
    if (!enabled || !subscribe) {
      return;
    }

    const unsubscribe = subscribe(SOCKET_EVENTS.EXECUTION_OUTPUT, (data) => {
      if (data?.roomId === roomId) {
        setExecutionOutput(data);
        setIsExecuting(false);
      }
    });

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, roomId]);

  // Cleanup
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  return {
    executeCode,
    isExecuting,
    executionOutput,
    executionError,
  };
}
