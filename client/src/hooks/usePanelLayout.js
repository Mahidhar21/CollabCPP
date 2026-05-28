/**
 * usePanelLayout Hook
 * 
 * Manages room panel visibility, sizing, and layout state.
 * Provides a clean interface for toggling panels and managing fullscreen modes.
 */

import { useState, useCallback } from 'react';

export function usePanelLayout() {
  const [panelStates, setPanelStates] = useState({
    chat: true,
    whiteboard: true,
    participants: true,
  });

  const [fullscreenPanel, setFullscreenPanel] = useState(null); // null | 'chat' | 'whiteboard'

  const [sidebarWidth, setSidebarWidth] = useState(320); // pixels

  const togglePanel = useCallback((panelName) => {
    setPanelStates((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  }, []);

  const setFullscreen = useCallback((panelName) => {
    setFullscreenPanel(panelName === fullscreenPanel ? null : panelName);
  }, [fullscreenPanel]);

  const closeFullscreen = useCallback(() => {
    setFullscreenPanel(null);
  }, []);

  const setSidebarSize = useCallback((width) => {
    setSidebarWidth(Math.max(240, Math.min(500, width))); // Clamp between 240-500px
  }, []);

  return {
    panelStates,
    fullscreenPanel,
    sidebarWidth,
    togglePanel,
    setFullscreen,
    closeFullscreen,
    setSidebarSize,
    isFullscreen: !!fullscreenPanel,
  };
}
