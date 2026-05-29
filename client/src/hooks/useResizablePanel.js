/**
 * useResizablePanel Hook
 * Manages draggable panel resizing with proper layout recalculation
 * 
 * Features:
 * - Mouse-based dragging
 * - Min/max constraints
 * - Smooth animations
 * - Monaco/window resize trigger
 * - Persistent size tracking
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export function useResizablePanel(initialSize, minSize, maxSize, onSizeChange) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const sizeAtDragStartRef = useRef(initialSize);
  const isHorizontalRef = useRef(false); // Track if horizontal or vertical resize

  const handleMouseDown = useCallback((e, isHorizontal = false) => {
    e.preventDefault();
    setIsDragging(true);
    isHorizontalRef.current = isHorizontal;
    dragStartRef.current = isHorizontal ? e.clientX : e.clientY;
    sizeAtDragStartRef.current = size;
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  }, [size]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const delta = isHorizontalRef.current 
        ? e.clientX - dragStartRef.current 
        : e.clientY - dragStartRef.current;
      
      const newSize = Math.max(minSize, Math.min(maxSize, sizeAtDragStartRef.current + delta));
      setSize(newSize);
      
      // Notify parent of size change
      onSizeChange?.(newSize);
      
      // Trigger layout recalculation for Monaco
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minSize, maxSize, onSizeChange]);

  return { 
    size, 
    isDragging, 
    handleMouseDown,
    setSize, // Allow external size updates
  };
}
