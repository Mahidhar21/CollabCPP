const PALETTE = [
  '#7dd3fc',
  '#a78bfa',
  '#f472b6',
  '#fb923c',
  '#4ade80',
  '#facc15',
  '#2dd4bf',
  '#c084fc',
];

export function getUserColor(userId) {
  if (!userId) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
