/**
 * ResizableDivider Component
 * 
 * Draggable divider for smooth panel resizing.
 * Works like VSCode's panel dividers.
 * 
 * Usage:
 * <div style={{ display: 'flex' }}>
 *   <div style={{ width: sidebarWidth }}>Left panel</div>
 *   <ResizableDivider 
 *     onResize={setSidebarWidth}
 *     vertical
 *   />
 *   <div style={{ flex: 1 }}>Right panel</div>
 * </div>
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn.js';

export function ResizableDivider({
  onResize,
  vertical = true,
  minSize = 200,
  maxSize = 800,
}) {
  const dividerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      if (vertical) {
        // Horizontal drag for vertical divider
        const newWidth = e.clientX;
        if (newWidth >= minSize && newWidth <= maxSize) {
          onResize(newWidth);
        }
      } else {
        // Vertical drag for horizontal divider
        const newHeight = e.clientY;
        if (newHeight >= minSize && newHeight <= maxSize) {
          onResize(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, onResize, vertical, minSize, maxSize]);

  const handleMouseDown = () => {
    setIsResizing(true);
    document.body.style.cursor = vertical ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={dividerRef}
      className={cn(
        'group transition-all duration-100 ease-out',
        vertical
          ? 'w-1 cursor-col-resize hover:w-1.5 bg-surface-border hover:bg-brand-highlight/50 active:bg-brand-highlight'
          : 'h-1 cursor-row-resize hover:h-1.5 bg-surface-border hover:bg-brand-highlight/50 active:bg-brand-highlight'
      )}
      onMouseDown={handleMouseDown}
      style={{
        flex: '0 0 auto',
      }}
    />
  );
}
