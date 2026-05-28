import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createRoom,
  joinRoom,
  getRecentRooms,
  getRoomById,
} from '../controllers/roomController.js';

const router = Router();

router.use(protect);

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/recent', getRecentRooms);
router.get('/:roomId', getRoomById);

export default router;
