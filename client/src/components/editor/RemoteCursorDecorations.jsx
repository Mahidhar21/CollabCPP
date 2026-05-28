import { useEffect, useRef } from 'react';
import { getUserColor } from '../../utils/userColor.js';

export default function RemoteCursorDecorations({ editor, monaco, remoteCursors }) {
  const decorationIdsRef = useRef([]);

  useEffect(() => {
    if (!editor || !monaco) return undefined;

    const decorations = Object.values(remoteCursors)
      .map((cursor) => {
        const { lineNumber, column } = cursor.position || {};
        if (!lineNumber || !column) return null;

        const color = getUserColor(cursor.userId);

        return {
          range: new monaco.Range(lineNumber, column, lineNumber, column),
          options: {
            className: 'remote-cursor-line',
            before: {
              content: ` ${cursor.username}`,
              inlineClassName: 'remote-cursor-label',
            },
            overviewRuler: {
              color,
              position: monaco.editor.OverviewRulerLane.Right,
            },
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        };
      })
      .filter(Boolean);

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    );

    return () => {
      editor.deltaDecorations(decorationIdsRef.current, []);
      decorationIdsRef.current = [];
    };
  }, [editor, monaco, remoteCursors]);

  return null;
}
