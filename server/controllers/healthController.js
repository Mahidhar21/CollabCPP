import env from '../config/env.js';
import mongoose from 'mongoose';

export const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    data: {
      service: 'CollabCPP API',
      version: '1.0.0',
      phase: 5,
      environment: env.nodeEnv,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatusMap[dbState] || 'unknown',
    },
  });
};

export const getApiInfo = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'CollabCPP API',
      description: 'Realtime collaborative C++ interview platform',
      phase: 5,
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        rooms: '/api/rooms',
        info: '/api',
      },
      upcoming: ['chat', 'whiteboard', 'execution'],
    },
  });
};
