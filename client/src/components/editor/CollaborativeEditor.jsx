import { useState } from 'react';
import Editor from '@monaco-editor/react';
import RemoteCursorDecorations from './RemoteCursorDecorations.jsx';

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineHeight: 22,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontLigatures: true,
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: 'line',
  bracketPairColorization: { enabled: true },
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
};

export default function CollaborativeEditor({
  code,
  onChange,
  onMount,
  remoteCursors,
  editorRef,
  monacoRef,
  readOnly = false,
}) {
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorInstance(editor);
    setMonacoInstance(monaco);
    onMount?.(editor, monaco);
  };

  return (
    <div className="collab-editor-wrap h-full min-h-0">
      <Editor
        height="100%"
        language="cpp"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        onMount={handleMount}
        options={{ ...EDITOR_OPTIONS, readOnly }}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-accent-dim">
            Loading editor…
          </div>
        }
      />
      <RemoteCursorDecorations
        editor={editorInstance}
        monaco={monacoInstance}
        remoteCursors={remoteCursors}
      />
    </div>
  );
}
