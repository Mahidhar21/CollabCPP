import Room from '../models/Room.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueRoomId } from '../utils/generateRoomId.js';

const populateOptions = [
  { path: 'owner', select: 'username email' },
  { path: 'participants.user', select: 'username email' },
];

export async function formatRoom(room, userId = null) {
  if (!room.populated('owner')) {
    await room.populate(populateOptions);
  }

  return {
    id: room._id,
    roomId: room.roomId,
    title: room.title,
    owner: room.owner?.toPublicJSON?.() || room.owner,
    participants: room.participants.map((p) => ({
      user: p.user?.toPublicJSON?.() || p.user,
      joinedAt: p.joinedAt,
    })),
    participantCount: room.participants.length,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    isOwner: userId
      ? (room.owner._id || room.owner.id).toString() === userId.toString()
      : false,
  };
}

export async function createRoomForUser(user, title) {
  const roomId = await generateUniqueRoomId(Room);

  const room = await Room.create({
    roomId,
    title,
    owner: user._id,
    participants: [{ user: user._id, joinedAt: new Date() }],
  });

  return formatRoom(room, user._id);
}

export async function joinRoomForUser(user, roomId) {
  const room = await Room.findOne({ roomId });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (!room.hasParticipant(user._id)) {
    room.participants.push({ user: user._id, joinedAt: new Date() });
    room.updatedAt = new Date();
    await room.save();
  } else {
    room.updatedAt = new Date();
    await room.save();
  }

  return formatRoom(room, user._id);
}

export async function getRoomForUser(user, roomId) {
  const uid = user._id;
  let room = await Room.findOne({
    roomId,
    $or: [{ owner: uid }, { 'participants.user': uid }],
  });

  if (!room) {
    const exists = await Room.exists({ roomId });
    if (!exists) {
      throw new AppError('Room not found', 404);
    }
    throw new AppError('You do not have access to this room', 403);
  }

  return formatRoom(room, user._id);
}

/** Add user to room participants if the room exists (idempotent). */
export async function ensureRoomMembership(user, roomId) {
  const room = await Room.findOne({ roomId });
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (!room.hasParticipant(user._id)) {
    room.participants.push({ user: user._id, joinedAt: new Date() });
    room.updatedAt = new Date();
    await room.save();
  }

  return formatRoom(room, user._id);
}

export async function getRecentRoomsForUser(userId, limit = 20) {
  const rooms = await Room.find({
    $or: [{ owner: userId }, { 'participants.user': userId }],
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate(populateOptions);

  return Promise.all(rooms.map((room) => formatRoom(room, userId)));
}
