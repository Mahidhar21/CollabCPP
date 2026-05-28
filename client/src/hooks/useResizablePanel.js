/**
 * useResizablePanel Hook
 * Manages draggable panel resizing with smooth UX
 * 
 * Features:
 * - Mouse-based dragging
 * - Min/max constraints
 * - Smooth animations
 * - Monaco resize trigger
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export function useResizablePanel(initialSize, minSize, maxSize, onResize) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const sizeAtDragStartRef = useRef(initialSize);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = e.clientY;
    sizeAtDragStartRef.current = size;
  }, [size]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const delta = e.clientY - dragStartRef.current;
      const newSize = Math.max(minSize, Math.min(maxSize, sizeAtDragStartRef.current + delta));
      setSize(newSize);
      onResize?.(newSize);
      // Trigger Monaco resize
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minSize, maxSize, onResize]);

  return { size, isDragging, handleMouseDown };
}
