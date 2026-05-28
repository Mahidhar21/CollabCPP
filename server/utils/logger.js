import env from '../config/env.js';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[env.logLevel] ?? levels.info;

function formatPayload(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, message };
  if (meta && Object.keys(meta).length > 0) {
    return JSON.stringify({ ...base, ...meta });
  }
  return JSON.stringify(base);
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= levels.error) {
      console.error(formatPayload('error', message, meta));
    }
  },
  warn(message, meta = {}) {
    if (currentLevel >= levels.warn) {
      console.warn(formatPayload('warn', message, meta));
    }
  },
  info(message, meta = {}) {
    if (currentLevel >= levels.info) {
      console.info(formatPayload('info', message, meta));
    }
  },
  debug(message, meta = {}) {
    if (currentLevel >= levels.debug) {
      console.debug(formatPayload('debug', message, meta));
    }
  },
};

export default logger;
