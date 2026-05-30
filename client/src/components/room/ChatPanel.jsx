import { useState, useRef, useEffect } from 'react';
import RoomPanel from './RoomPanel.jsx';
import { useChat } from '../../hooks/useChat.js';

export default function ChatPanel({
  isActive,
  roomId,
  messages: propMessages,
  loading: propLoading,
  error: propError,
  isSending: propIsSending,
  sendMessage: propSendMessage,
  onSendMessage,
}) {
  const useHook = !propMessages;
  const chat = useChat(useHook ? roomId : null, useHook ? isActive : false);

  const messages = propMessages ?? chat.messages;
  const loading = propLoading ?? chat.loading;
  const error = propError ?? chat.error;
  const isSending = propIsSending ?? chat.isSending;

  const sendMessage = propSendMessage ?? onSendMessage ?? chat.sendMessage;
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <RoomPanel title="Chat" subtitle="Live conversation" className="min-h-0 flex-1" bodyClassName="p-3">
      <div className="flex h-full min-h-[120px] flex-col gap-3">
        {/* Messages Container */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-surface-overlay p-2">
          {loading && !messages.length ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-accent-dim">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-accent-dim">No messages yet. Start chatting!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.messageId} className="flex flex-col gap-0.5 border-l border-surface-border pl-2 py-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-accent">{msg.username}</span>
                  <span className="text-[10px] text-accent-dim">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="break-words text-xs leading-relaxed text-foreground">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Input Box */}
        <div className="rounded-lg border border-surface-border bg-surface-overlay p-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message…"
              disabled={!isActive || isSending}
              className="flex-1 bg-transparent text-xs outline-none placeholder-accent-dim disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !isActive || isSending}
              className="rounded px-2 py-1 text-xs font-medium text-accent hover:bg-surface-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </RoomPanel>
  );
}
