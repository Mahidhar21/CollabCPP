import mongoose from 'mongoose';
import Room from '../../models/Room.js';
import { isValidRoomId, normalizeRoomId } from '../../utils/generateRoomId.js';

export function parseRoomId(rawRoomId) {
  const roomId = normalizeRoomId(rawRoomId);
  if (!isValidRoomId(roomId)) {
    return { valid: false, roomId: null, error: 'Invalid room ID format' };
  }
  return { valid: true, roomId, error: null };
}

export async function assertRoomAccess(userId, roomId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const room = await Room.findOne({
    roomId,
    $or: [{ owner: uid }, { 'participants.user': uid }],
  });

  if (room) {
    return { allowed: true, room, error: null };
  }

  const exists = await Room.exists({ roomId });
  if (!exists) {
    return { allowed: false, error: 'Room not found' };
  }

  return { allowed: false, error: 'You do not have access to this room' };
}
