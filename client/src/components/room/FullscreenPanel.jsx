/**
 * FullscreenPanel Component
 * 
 * Renders a single panel in fullscreen mode.
 * Overlays the entire room with one expanded panel.
 */

import React, { useEffect } from 'react';
import { PanelHeader } from '../ui/PanelHeader.jsx';
import ChatPanel from './ChatPanel.jsx';
import WhiteboardPanel from './WhiteboardPanel.jsx';

export function FullscreenPanel({
  panelName,
  onClose,
  // Props for panels
  isJoined,
  roomId,
}) {
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
    return () => {
      window.dispatchEvent(new Event('resize'));
    };
  }, []);
  const renderPanel = () => {
    switch (panelName) {
      case 'chat':
        return <ChatPanel isActive={isJoined} roomId={roomId} />;
      case 'whiteboard':
        return <WhiteboardPanel isActive={isJoined} roomId={roomId} />;
      default:
        return null;
    }
  };

  const getPanelTitle = () => {
    switch (panelName) {
      case 'chat':
        return 'Chat';
      case 'whiteboard':
        return 'Whiteboard';
      default:
        return 'Panel';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <PanelHeader
        title={getPanelTitle()}
        onFullscreen={onClose}
        isFullscreen={true}
        className="border-b-2 border-surface-border"
      />

      <div className="flex-1 overflow-hidden">
        {renderPanel()}
      </div>
    </div>
  );
}
