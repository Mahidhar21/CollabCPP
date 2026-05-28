import morgan from 'morgan';
import env from '../config/env.js';

const devFormat =
  ':method :url :status :res[content-length] - :response-time ms';

export const requestLogger =
  env.isDevelopment
    ? morgan(devFormat)
    : morgan('combined', {
        skip: (req, res) => res.statusCode < 400,
      });
