import { cn } from '../../utils/cn.js';

/**
 * WhiteboardToolbar
 * Toolbar with pen, eraser, and clear controls
 */
export default function WhiteboardToolbar({
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  isDisabled = false,
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-overlay px-3 py-2">
      {/* Pen Tool */}
      <button
        onClick={() => onToolChange('pen')}
        disabled={isDisabled}
        title="Pen tool"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded transition-colors',
          tool === 'pen'
            ? 'bg-accent text-surface-overlay'
            : 'bg-surface-border/50 text-accent hover:bg-surface-border'
        )}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
        </svg>
      </button>

      {/* Eraser Tool */}
      <button
        onClick={() => onToolChange('eraser')}
        disabled={isDisabled}
        title="Eraser tool"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded transition-colors',
          tool === 'eraser'
            ? 'bg-accent text-surface-overlay'
            : 'bg-surface-border/50 text-accent hover:bg-surface-border'
        )}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16.54 11L19.7 7.85c.78-.78.78-2.05 0-2.83-.78-.78-2.05-.78-2.83 0l-3.15 3.15L6.41 3c-.78-.78-2.05-.78-2.83 0-.78.78-.78 2.05 0 2.83l3.15 3.15-3.15 3.15c-.78.78-.78 2.05 0 2.83.39.39.9.59 1.41.59.51 0 1.02-.2 1.41-.59l3.15-3.15 3.15 3.15c.39.39.9.59 1.41.59.51 0 1.02-.2 1.41-.59.78-.78.78-2.05 0-2.83L16.54 11z" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-surface-border/50" />

      {/* Brush Size Slider */}
      {tool === 'pen' && (
        <>
          <label className="text-xs text-accent-dim">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            disabled={isDisabled}
            className="h-1 w-20 cursor-pointer bg-surface-border rounded accent-current"
          />
          <span className="text-xs text-accent-dim w-6">{brushSize}</span>
        </>
      )}

      {/* Clear Button */}
      <button
        onClick={onClear}
        disabled={isDisabled}
        title="Clear canvas"
        className="ml-auto flex h-8 px-2 items-center gap-1 rounded bg-surface-border/50 text-xs text-accent hover:bg-surface-border transition-colors disabled:opacity-50"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Clear
      </button>
    </div>
  );
}
