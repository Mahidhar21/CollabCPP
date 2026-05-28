import { AppError } from './AppError.js';
import { isValidRoomId, normalizeRoomId } from './generateRoomId.js';

export function validateCreateRoomBody({ title }) {
  const errors = [];

  if (!title?.trim()) errors.push('Room title is required');
  else if (title.trim().length > 80) errors.push('Title cannot exceed 80 characters');

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { title: title.trim() };
}

export function validateJoinRoomBody({ roomId }) {
  const errors = [];

  if (!roomId?.trim()) errors.push('Room ID is required');
  else if (!isValidRoomId(roomId)) {
    errors.push('Invalid room ID format (e.g. cpp-7F3K2A)');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { roomId: normalizeRoomId(roomId) };
}

export function validateRoomIdParam(roomId) {
  const normalized = normalizeRoomId(roomId);
  if (!isValidRoomId(normalized)) {
    throw new AppError('Invalid room ID format', 400);
  }
  return normalized;
}
