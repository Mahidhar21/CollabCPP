const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'CPP';
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 8;

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function generateRoomId() {
  return `${PREFIX}-${randomCode()}`;
}

export async function generateUniqueRoomId(Room) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const roomId = generateRoomId();
    const exists = await Room.exists({ roomId });
    if (!exists) return roomId;
  }
  throw new Error('Failed to generate unique room ID');
}

export const ROOM_ID_REGEX = /^CPP-[A-HJ-NP-Z2-9]{6}$/;

export function normalizeRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') return '';
  const trimmed = roomId.trim().toUpperCase();
  const match = trimmed.match(/^CPP-([A-HJ-NP-Z2-9]{6})$/);
  if (match) return `CPP-${match[1]}`;
  return trimmed;
}

export function isValidRoomId(roomId) {
  return ROOM_ID_REGEX.test(normalizeRoomId(roomId));
}
