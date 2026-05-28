import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Socket.IO handshake middleware — authenticates via JWT in handshake.auth.token
 */
export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err) {
    logger.warn('Socket auth failed', { message: err.message });
    next(new Error('Invalid or expired token'));
  }
}
