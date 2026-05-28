import RoomPanel from './RoomPanel.jsx';
import CollaborativeEditor from '../editor/CollaborativeEditor.jsx';
import EditorTypingIndicator from '../editor/EditorTypingIndicator.jsx';

export default function EditorPanel({
  code,
  onChange,
  onMount,
  remoteCursors,
  typers,
  editorRef,
  monacoRef,
  isConnected,
  readOnly = false,
  onRunCode,
  isExecuting = false,
}) {
  return (
    <RoomPanel
      title="Editor"
      subtitle="C++ · Collaborative"
      className="min-h-0 flex-1"
      bodyClassName="p-0 flex flex-col min-h-0"
      badge="main.cpp"
    >
      <div className="flex h-full min-h-0 flex-col bg-[#0a0a0b]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-surface-border px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-surface-muted" />
            <span className="h-2 w-2 rounded-full bg-surface-muted" />
            <span className="h-2 w-2 rounded-full bg-surface-muted" />
            <span className="ml-1 font-mono text-[10px] text-accent-dim">main.cpp</span>
          </div>
          <div className="flex items-center gap-3">
            <EditorTypingIndicator typers={typers} />
            {onRunCode && (
              <button
                onClick={() => onRunCode(code)}
                disabled={isExecuting || readOnly}
                className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-medium transition-all duration-200 rounded bg-accent-muted hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-surface"
              >
                {isExecuting ? 'Running...' : 'Run'}
              </button>
            )}
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                isConnected ? 'text-emerald-400/80' : 'text-accent-dim'
              }`}
            >
              {isConnected ? 'Synced' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <CollaborativeEditor
            code={code}
            onChange={onChange}
            onMount={onMount}
            remoteCursors={remoteCursors}
            editorRef={editorRef}
            monacoRef={monacoRef}
            readOnly={readOnly}
          />
        </div>
      </div>
    </RoomPanel>
  );
}
