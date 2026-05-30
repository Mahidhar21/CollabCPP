/**
 * IDERoomLayout Component
 * Professional IDE-style layout with properly resizable panels
 * 
 * Layout Structure:
 * ┌────────────────────────────────────────┐
 * │         Room Header (fixed top)        │
 * ├──────────┬──────────────────────────────┤
 * │          │                              │
 * │ Sidebar  │ Editor + Output              │
 * │(resiz)   │ (Editor fills, Output fixed) │
 * │          │                              │
 * └──────────┴──────────────────────────────┘
 * 
 * Resizing:
 * - Sidebar: horizontal (left/right drag)
 * - Output: vertical (up/down drag)
 * - Editor: fills remaining space
 */

import { useCallback, useEffect } from 'react';
import { useResizablePanel } from '../../hooks/useResizablePanel.js';
import EditorPanel from './EditorPanel.jsx';
import OutputPanel from './OutputPanel.jsx';
import { RoomSidebar } from './RoomSidebar.jsx';
import { FullscreenPanel } from './FullscreenPanel.jsx';

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 500;
const SIDEBAR_DEFAULT = 320;

const OUTPUT_MIN = 120;
const OUTPUT_MAX = 400;
const OUTPUT_DEFAULT = 200;

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
  
  // Fullscreen
  fullscreenPanel,
  onFullscreenChat,
  onFullscreenWhiteboard,
  onCloseFullscreen,
  
  // Room
  room,
  isJoined,
  roomId,
  onCopyId,
}) {
  // Sidebar width resizing (horizontal)
  const { 
    size: sidebarWidth, 
    handleMouseDown: handleSidebarResize,
    isDragging: isSidebarDragging,
  } = useResizablePanel(
    SIDEBAR_DEFAULT,
    SIDEBAR_MIN,
    SIDEBAR_MAX,
    useCallback(() => {
      // Trigger Monaco layout recalculation
      window.dispatchEvent(new Event('resize'));
    }, [])
  );

  // Output panel height resizing (vertical)
  const { 
    size: outputHeight, 
    handleMouseDown: handleOutputResize,
    isDragging: isOutputDragging,
  } = useResizablePanel(
    OUTPUT_DEFAULT,
    OUTPUT_MIN,
    OUTPUT_MAX,
    useCallback(() => {
      // Trigger Monaco layout recalculation
      window.dispatchEvent(new Event('resize'));
    }, [])
  );

  useEffect(() => {
    if (fullscreenPanel) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [fullscreenPanel]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {fullscreenPanel && (
        <FullscreenPanel
          panelName={fullscreenPanel}
          onClose={onCloseFullscreen}
          isJoined={isJoined}
          roomId={roomId}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="flex-shrink-0 overflow-hidden transition-none"
      >
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
          fullscreenPanel={fullscreenPanel}
          onFullscreenChat={onFullscreenChat}
          onFullscreenWhiteboard={onFullscreenWhiteboard}
        />
      </div>

      {/* ===== SIDEBAR RESIZE HANDLE (horizontal) ===== */}
      <div
        onMouseDown={(e) => handleSidebarResize(e, true)} // true = horizontal
        className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${
          isSidebarDragging 
            ? 'bg-accent/60' 
            : 'bg-surface-border hover:bg-accent/40'
        }`}
        title="Drag to resize sidebar"
      />

      {/* ===== MAIN EDITOR AREA ===== */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Editor Panel */}
        <div className="flex min-h-0 flex-1">
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
        </div>

        {/* ===== OUTPUT RESIZE HANDLE (vertical) ===== */}
        <div
          onMouseDown={(e) => handleOutputResize(e, false)} // false = vertical
          className={`h-1 flex-shrink-0 cursor-row-resize transition-colors ${
            isOutputDragging 
              ? 'bg-accent/60' 
              : 'bg-surface-border hover:bg-accent/40'
          }`}
          title="Drag to resize output console"
        />

        {/* Output Panel */}
        <div 
          style={{ height: `${outputHeight}px` }}
          className="flex-shrink-0 overflow-hidden"
        >
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

