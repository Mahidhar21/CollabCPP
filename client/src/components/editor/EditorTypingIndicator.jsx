export default function EditorTypingIndicator({ typers = [] }) {
  if (typers.length === 0) return null;

  const names = typers.map((t) => t.username).filter(Boolean);
  if (names.length === 0) return null;

  let text = '';
  if (names.length === 1) text = `${names[0]} is typing`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing`;
  else text = `${names.slice(0, 2).join(', ')} and others are typing`;

  return (
    <span className="animate-fade-in font-mono text-[10px] text-accent-dim">
      <span className="inline-flex gap-0.5">
        <span className="animate-pulse">●</span>
        <span className="animate-pulse [animation-delay:150ms]">●</span>
        <span className="animate-pulse [animation-delay:300ms]">●</span>
      </span>
      {' '}
      {text}
    </span>
  );
}
