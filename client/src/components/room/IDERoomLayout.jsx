/**
 * IDERoomLayout Component
 * Professional IDE-style layout with all panels visible and resizable
 * 
 * Structure:
 * ┌─────────────────────────────────────┐
 * │           Room Header               │
 * ├──────────────┬──────────────────────┤
 * │              │                      │
 * │  Sidebar     │  Editor + Output     │
 * │  (collapsible)        (resizable)   │
 * │              │                      │
 * └──────────────┴──────────────────────┘
 */

import { useState, useCallback } from 'react';
import { cn } from '../../utils/cn.js';
import { useResizablePanel } from '../../hooks/useResizablePanel.js';
import EditorPanel from './EditorPanel.jsx';
import OutputPanel from './OutputPanel.jsx';
import { RoomSidebar } from './RoomSidebar.jsx';

export function IDERoomLayout({
  // Editor
  code,
  onCodeChange,
  editorRef,
  monacoRef,
  onEditorMount,
  remoteCursors,
  typers,
  isConnected,
  
  // Execution
  onRunCode,
  isExecuting,
  executionOutput,
  executionError,
  stdinInput,
  onStdinChange,
  
  // Sidebar
  participants,
  presenceLoading,
  presenceError,
  
  // Chat
  chatMessages,
  chatLoading,
  chatError,
  chatIsSending,
  onChatSend,
  
  // Room
  room,
  isJoined,
  roomId,
  onCopyId,
}) {
  // Sidebar width resizing
  const { size: sidebarWidth, handleMouseDown: handleSidebarResize } = useResizablePanel(
    320,  // initial
    240,  // min
    500,  // max
    () => {}  // onResize (triggers window resize for Monaco)
  );

  // Output panel height resizing
  const { size: outputHeight, handleMouseDown: handleOutputResize } = useResizablePanel(
    200,  // initial
    120,  // min
    400,  // max
    () => {}
  );

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Sidebar with Participants + Chat + Whiteboard */}
      <RoomSidebar
        sidebarWidth={sidebarWidth}
        participants={participants}
        presenceLoading={presenceLoading}
        presenceError={presenceError}
        chatProps={{
          messages: chatMessages,
          loading: chatLoading,
          error: chatError,
          isSending: chatIsSending,
          sendMessage: onChatSend,
        }}
        isJoined={isJoined}
        roomId={roomId}
      />

      {/* Sidebar Resize Handle */}
      <div
        onMouseDown={handleSidebarResize}
        className="w-1 bg-surface-border hover:bg-accent/40 cursor-col-resize transition-colors shrink-0"
        title="Drag to resize sidebar"
      />

      {/* Main Editor Area */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Editor Panel */}
        <EditorPanel
          code={code}
          onChange={onCodeChange}
          onMount={onEditorMount}
          remoteCursors={remoteCursors}
          typers={typers}
          editorRef={editorRef}
          monacoRef={monacoRef}
          isConnected={isConnected}
          onRunCode={onRunCode}
          isExecuting={isExecuting}
        />

        {/* Output Resize Handle */}
        <div
          onMouseDown={handleOutputResize}
          className="h-1 bg-surface-border hover:bg-accent/40 cursor-row-resize transition-colors shrink-0"
          title="Drag to resize output panel"
        />

        {/* Output Panel */}
        <div style={{ height: `${outputHeight}px` }} className="overflow-hidden">
          <OutputPanel
            output={executionOutput}
            isExecuting={isExecuting}
            error={executionError}
            stdinInput={stdinInput}
            onStdinChange={onStdinChange}
          />
        </div>
      </div>
    </div>
  );
}
