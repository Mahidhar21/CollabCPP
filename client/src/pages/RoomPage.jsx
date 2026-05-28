import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import RoomHeader from '../components/room/RoomHeader.jsx';
import { IDERoomLayout } from '../components/room/IDERoomLayout.jsx';
import { SessionStatus } from '../components/room/SessionStatus.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/auth/Spinner.jsx';
import { useRoom } from '../hooks/useRooms.js';
import { useRoomSocket } from '../hooks/useRoomSocket.js';
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor.js';
import { useCodeExecutionWithInput } from '../hooks/useCodeExecutionWithInput.js';
import { useChat } from '../hooks/useChat.js';
import { usePresence } from '../hooks/usePresence.js';
import { useSession } from '../hooks/useSession.js';
import useAuthStore from '../store/useAuthStore.js';

export default function RoomPage() {
  const { roomId } = useParams();
  const normalizedRoomId = roomId?.toUpperCase();
  const { room, loading, error, refetch, accessReady } = useRoom(normalizedRoomId);
  const { user } = useAuthStore();
  const {
    connectionStatus,
    roomSocketStatus,
    roomError,
    isJoined,
    isConnected,
  } = useRoomSocket(normalizedRoomId, accessReady);

  const {
    code,
    remoteCursors,
    typers,
    editorRef,
    monacoRef,
    handleEditorMount,
    handleEditorChange,
  } = useCollaborativeEditor(normalizedRoomId, isJoined && accessReady, user);

  // Enhanced execution with stdin support
  const {
    executeCode,
    isExecuting,
    executionOutput,
    executionError,
    stdinInput,
    setStdinInput,
  } = useCodeExecutionWithInput(normalizedRoomId, isJoined && accessReady);

  const {
    messages,
    loading: chatLoading,
    error: chatError,
    isSending,
    sendMessage,
  } = useChat(normalizedRoomId, isJoined && accessReady);

  const { participants, loading: presenceLoading, error: presenceError } = usePresence(
    normalizedRoomId,
    isJoined && accessReady
  );

  // Session persistence
  const {
    saveStatus,
    persistCode,
    persistChatMessage,
    saveSession,
  } = useSession(normalizedRoomId, isJoined && accessReady);

  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Persist code changes
  useEffect(() => {
    if (code && isJoined && accessReady) {
      persistCode(code);
    }
  }, [code, isJoined, accessReady, persistCode]);

  // Persist chat messages
  useEffect(() => {
    if (messages.length > 0 && isJoined && accessReady) {
      const lastMessage = messages[messages.length - 1];
      persistChatMessage(lastMessage, lastMessage.senderId, lastMessage.senderName);
    }
  }, [messages, isJoined, accessReady, persistChatMessage]);

  // Handle room leave with full session save
  useEffect(() => {
    return () => {
      if (isJoined && room) {
        saveSession({
          title: room.title,
          owner: room.owner,
          participants: participants.map((p) => ({
            user: p.id,
            username: p.username,
            joinedAt: p.joinedAt,
            lastActive: new Date(),
          })),
          currentCode: code,
          chatHistory: messages,
        });
      }
    };
  }, [isJoined, room, participants, code, messages, saveSession]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-accent-dim">Loading room…</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface px-4">
        <p className="text-sm text-red-400">{error || 'Room not found'}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>
            Retry
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Header */}
      <RoomHeader
        room={room}
        onCopyId={handleCopyId}
        connectionStatus={connectionStatus}
        roomSocketStatus={roomSocketStatus}
        roomError={roomError}
      />

      {/* Room ID copied notification */}
      {copied && (
        <div className="absolute right-4 top-14 z-10 rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 text-xs text-accent-muted shadow-lg animate-fade-in">
          Room ID copied to clipboard
        </div>
      )}

      {/* Main IDE Layout */}
      <IDERoomLayout
        code={code}
        onCodeChange={handleEditorChange}
        editorRef={editorRef}
        monacoRef={monacoRef}
        onEditorMount={handleEditorMount}
        remoteCursors={remoteCursors}
        typers={typers}
        isConnected={isJoined && isConnected}
        onRunCode={executeCode}
        isExecuting={isExecuting}
        executionOutput={executionOutput}
        executionError={executionError}
        stdinInput={stdinInput}
        onStdinChange={setStdinInput}
        participants={participants}
        presenceLoading={presenceLoading}
        presenceError={presenceError}
        chatMessages={messages}
        chatLoading={chatLoading}
        chatError={chatError}
        chatIsSending={isSending}
        onChatSend={sendMessage}
        room={room}
        isJoined={isJoined && accessReady}
        roomId={normalizedRoomId}
        onCopyId={handleCopyId}
      />

      {/* Session persistence status */}
      <SessionStatus status={saveStatus} lastSaved={new Date()} />
    </div>
  );
}

