export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (resource = 'Resource') =>
  new AppError(`${resource} not found`, 404);

export const badRequest = (message = 'Bad request', errors = null) =>
  new AppError(message, 400, errors);
