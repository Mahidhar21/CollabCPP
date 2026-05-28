import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import codeRoutes from './codeRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import { getApiInfo } from '../controllers/healthController.js';

const router = Router();

router.get('/', getApiInfo);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/code', codeRoutes);
router.use('/sessions', sessionRoutes);

export default router;
