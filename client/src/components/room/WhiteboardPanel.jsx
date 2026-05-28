import RoomPanel from './RoomPanel.jsx';
import WhiteboardToolbar from './WhiteboardToolbar.jsx';
import { useWhiteboardFixed } from '../../hooks/useWhiteboardFixed.js';

/**
 * WhiteboardPanel
 * Collaborative whiteboard for drawing in interview rooms.
 *
 * Features:
 * - Real-time drawing synchronization (stroke-based)
 * - Pen and eraser tools
 * - Clear canvas
 * - Responsive canvas sizing
 * - Dark theme styling
 * - Smooth collaborative drawing
 */
export default function WhiteboardPanel({ isActive = false, roomId = null }) {
  const { canvasRef, tool, setTool, brushSize, setBrushSize, clearCanvas } = useWhiteboardFixed(
    roomId,
    isActive
  );

  return (
    <RoomPanel title="Whiteboard" subtitle="Smooth collaborative drawing" className="min-h-0 flex-1">
      <div className="flex h-full min-h-[200px] flex-col gap-2">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="flex-1 min-h-[200px] rounded-lg bg-gradient-to-br from-surface-overlay to-surface-border/30"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
        />

        {/* Toolbar */}
        <WhiteboardToolbar
          tool={tool}
          onToolChange={setTool}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onClear={clearCanvas}
          isDisabled={!isActive}
        />
      </div>
    </RoomPanel>
  );
}
