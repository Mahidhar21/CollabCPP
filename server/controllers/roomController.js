import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createRoomForUser,
  joinRoomForUser,
  getRecentRoomsForUser,
  getRoomForUser,
  ensureRoomMembership,
} from '../services/roomService.js';
import { validateCreateRoomBody, validateJoinRoomBody, validateRoomIdParam } from '../utils/validateRoom.js';

export const createRoom = asyncHandler(async (req, res) => {
  const { title } = validateCreateRoomBody(req.body);
  const room = await createRoomForUser(req.user, title);

  res.status(201).json({
    success: true,
    data: { room },
  });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = validateJoinRoomBody(req.body);
  const room = await joinRoomForUser(req.user, roomId);

  res.status(200).json({
    success: true,
    data: { room },
  });
});

export const getRecentRooms = asyncHandler(async (req, res) => {
  const rooms = await getRecentRoomsForUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { rooms, count: rooms.length },
  });
});

export const getRoomById = asyncHandler(async (req, res) => {
  const roomId = validateRoomIdParam(req.params.roomId);

  try {
    const room = await getRoomForUser(req.user, roomId);
    res.status(200).json({
      success: true,
      data: { room },
    });
  } catch (err) {
    if (err.statusCode === 403) {
      const room = await ensureRoomMembership(req.user, roomId);
      return res.status(200).json({
        success: true,
        data: { room, joined: true },
      });
    }
    throw err;
  }
});
