/**
 * RoomSidebar Component
 * 
 * Resizable sidebar containing:
 * - Participants panel (collapsible)
 * - Chat panel (collapsible)
 * - Whiteboard panel (collapsible)
 * 
 * Features:
 * - Smooth resizing via divider
 * - Panel collapse/expand
 * - Fullscreen modes
 * - Clean IDE-like layout
 */

import React, { useState } from 'react';
import { PanelHeader } from '../ui/PanelHeader.jsx';
import ParticipantsPanel from './ParticipantsPanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import WhiteboardPanel from './WhiteboardPanel.jsx';
import { cn } from '../../utils/cn.js';

export function RoomSidebar({
  sidebarWidth,
  onResize,
  // Participants
  participants,
  presenceLoading,
  presenceError,
  // Chat
  chatProps,
  isJoined,
  roomId,
  // Fullscreen control
  onFullscreenChat,
  onFullscreenWhiteboard,
  fullscreenPanel,
  panelStates,
  onTogglePanel,
}) {
  const [localCollapsedPanels, setLocalCollapsedPanels] = useState({
    participants: false,
    chat: false,
    whiteboard: false,
  });

  const collapsedPanels = panelStates || localCollapsedPanels;

  const togglePanel = (panelName) => {
    if (onTogglePanel) {
      onTogglePanel(panelName);
      return;
    }

    setLocalCollapsedPanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  };

  const iconUsers = (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.89 1.97 1.74 1.97 2.95V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );

  const iconChat = (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm13 5H6v-2h13v2zm0-4H6V7h13v3z" />
    </svg>
  );

  const iconPalette = (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-5.5 9c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm5.5 6c-1.1 0-2-0.9-2-2s0.9-2 2-2 2 0.9 2 2-0.9 2-2 2zm5.5-6c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0-10c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2z" />
    </svg>
  );

  return (
    <div
      className="flex flex-col h-full bg-surface-overlay border-r border-surface-border overflow-hidden"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Participants Panel */}
      <div className="flex-shrink-0 border-b border-surface-border">
        <PanelHeader
          title="Participants"
          icon={iconUsers}
          onToggle={() => togglePanel('participants')}
          isCollapsed={collapsedPanels.participants}
        />
        {!collapsedPanels.participants && (
          <div className="overflow-hidden">
            <ParticipantsPanel
              participants={participants}
              isLoading={presenceLoading}
              error={presenceError}
            />
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <div
        className={cn(
          'flex flex-col flex-1 border-b border-surface-border overflow-hidden',
          collapsedPanels.chat && 'flex-shrink-0'
        )}
      >
        <PanelHeader
          title="Chat"
          icon={iconChat}
          onToggle={() => togglePanel('chat')}
          onFullscreen={() => onFullscreenChat?.('chat')}
          isFullscreen={fullscreenPanel === 'chat'}
          isCollapsed={collapsedPanels.chat}
        />
        {!collapsedPanels.chat && (
          <div className="flex-1 overflow-hidden">
            <ChatPanel isActive={isJoined} roomId={roomId} {...chatProps} />
          </div>
        )}
      </div>

      {/* Whiteboard Panel */}
      <div
        className={cn(
          'flex flex-col flex-1 overflow-hidden',
          collapsedPanels.whiteboard && 'flex-shrink-0'
        )}
      >
        <PanelHeader
          title="Whiteboard"
          icon={iconPalette}
          onToggle={() => togglePanel('whiteboard')}
          onFullscreen={() => onFullscreenWhiteboard?.('whiteboard')}
          isFullscreen={fullscreenPanel === 'whiteboard'}
          isCollapsed={collapsedPanels.whiteboard}
        />
        {!collapsedPanels.whiteboard && (
          <div className="flex-1 overflow-hidden">
            <WhiteboardPanel isActive={isJoined} roomId={roomId} />
          </div>
        )}
      </div>
    </div>
  );
}
