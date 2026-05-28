import { useCallback, useEffect, useRef, useState } from 'react';
import { SOCKET_EVENTS } from '../sockets/socketEvents.js';
import { getSocket } from '../sockets/socketClient.js';
import useSocketStore from '../store/useSocketStore.js';
import { DEFAULT_CPP_CODE } from '../utils/defaultCode.js';
import { debounce, throttle } from '../utils/throttle.js';

const CODE_DEBOUNCE_MS = 120;
const CURSOR_THROTTLE_MS = 80;
const TYPING_STOP_MS = 2000;

/**
 * Collaborative editor sync hook.
 *
 * Loop prevention: `isApplyingRemoteRef` blocks local emits when applying
 * remote code from socket. Origin userId is ignored on incoming changes.
 */
export function useCollaborativeEditor(roomId, enabled, currentUser) {
  const subscribe = useSocketStore((s) => s.subscribe);

  const [code, setCode] = useState(DEFAULT_CPP_CODE);
  const [version, setVersion] = useState(0);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [typers, setTypers] = useState([]);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const codeRef = useRef(code);
  const versionRef = useRef(0);

  codeRef.current = code;
  versionRef.current = version;

  const emitCodeChangeRef = useRef(null);
  if (!emitCodeChangeRef.current) {
    emitCodeChangeRef.current = debounce((rid, newCode) => {
      const socket = getSocket();
      if (!socket?.connected || !rid || isApplyingRemoteRef.current) return;
      socket.emit(SOCKET_EVENTS.CODE_CHANGE, { roomId: rid, code: newCode });
    }, CODE_DEBOUNCE_MS);
  }

  const emitCursorMove = useRef(
    throttle((position, selection) => {
      const socket = getSocket();
      if (!socket?.connected || !roomId) return;
      socket.emit(SOCKET_EVENTS.CURSOR_MOVE, {
        roomId,
        position,
        selection,
      });
    }, CURSOR_THROTTLE_MS)
  ).current;

  const emitTypingStart = useCallback(() => {
    const socket = getSocket();
    if (!socket?.connected || !roomId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(SOCKET_EVENTS.TYPING_START, { roomId });
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { roomId });
    }, TYPING_STOP_MS);
  }, [roomId]);

  const applyRemoteCode = useCallback((newCode, newVersion, originUserId) => {
    if (originUserId === currentUser?.id) return;
    if (newVersion < versionRef.current) return;

    isApplyingRemoteRef.current = true;
    setCode(newCode);
    setVersion(newVersion);
    versionRef.current = newVersion;

    requestAnimationFrame(() => {
      isApplyingRemoteRef.current = false;
    });
  }, [currentUser?.id]);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      if (isApplyingRemoteRef.current) return;
      const pos = e.position;
      const sel = editor.getSelection();
      emitCursorMove(
        { lineNumber: pos.lineNumber, column: pos.column },
        sel
          ? {
              startLineNumber: sel.startLineNumber,
              startColumn: sel.startColumn,
              endLineNumber: sel.endLineNumber,
              endColumn: sel.endColumn,
            }
          : null
      );
    });
  }, [emitCursorMove]);

  const handleEditorChange = useCallback(
    (value) => {
      if (isApplyingRemoteRef.current) return;
      const next = value ?? '';
      setCode(next);
      emitCodeChangeRef.current(roomId, next);
      emitTypingStart();
    },
    [roomId, emitTypingStart]
  );

  useEffect(() => {
    if (!enabled || !roomId) return undefined;

    const matchRoom = (data) =>
      data?.roomId?.toUpperCase() === roomId.toUpperCase();

    const unsubSync = subscribe(SOCKET_EVENTS.EDITOR_CODE_SYNC, (data) => {
      if (!matchRoom(data)) return;
      isApplyingRemoteRef.current = true;
      setCode(data.code ?? DEFAULT_CPP_CODE);
      setVersion(data.version ?? 0);
      versionRef.current = data.version ?? 0;

      const cursorsMap = {};
      (data.cursors || []).forEach((c) => {
        if (c.userId !== currentUser?.id) cursorsMap[c.userId] = c;
      });
      setRemoteCursors(cursorsMap);
      setTypers((data.typers || []).filter((t) => t.userId !== currentUser?.id));

      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = false;
      });
    });

    const unsubCode = subscribe(SOCKET_EVENTS.EDITOR_CODE_CHANGE, (data) => {
      if (!matchRoom(data)) return;
      applyRemoteCode(data.code, data.version ?? versionRef.current + 1, data.origin?.userId);
    });

    const unsubCursor = subscribe(SOCKET_EVENTS.EDITOR_CURSOR_MOVE, (data) => {
      if (!matchRoom(data)) return;
      if (data.cursor?.userId === currentUser?.id) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [data.cursor.userId]: data.cursor,
      }));
    });

    const unsubCursorRemove = subscribe(SOCKET_EVENTS.EDITOR_CURSOR_REMOVE, (data) => {
      if (!matchRoom(data)) return;
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    const unsubTyping = subscribe(SOCKET_EVENTS.EDITOR_TYPING_UPDATE, (data) => {
      if (!matchRoom(data)) return;
      setTypers((data.typers || []).filter((t) => t.userId !== currentUser?.id));
    });

    return () => {
      unsubSync();
      unsubCode();
      unsubCursor();
      unsubCursorRemove();
      unsubTyping();
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.TYPING_STOP, { roomId });
      }
    };
  }, [
    enabled,
    roomId,
    subscribe,
    currentUser?.id,
    applyRemoteCode,
  ]);

  return {
    code,
    remoteCursors,
    typers,
    editorRef,
    monacoRef,
    handleEditorMount,
    handleEditorChange,
  };
}
