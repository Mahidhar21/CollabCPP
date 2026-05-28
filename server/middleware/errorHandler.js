import { AppError } from '../utils/AppError.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const handleCastError = () => new AppError('Invalid resource identifier', 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return new AppError(`Duplicate value for ${field}`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors || {}).map((e) => e.message);
  return new AppError('Validation failed', 400, messages);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  }

  logger.error('Unexpected error', { message: err.message });
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
};

export const errorHandler = (err, req, res, next) => {
  let error = err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500);
  error.statusCode = error.statusCode || 500;
  error.status = error.status || `${error.statusCode}`.startsWith('4') ? 'fail' : 'error';

  if (err.name === 'CastError') error = handleCastError();
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);

  if (env.isDevelopment) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
