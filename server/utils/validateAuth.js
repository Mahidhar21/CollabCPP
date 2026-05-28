import { AppError } from './AppError.js';

export function validateSignupBody({ username, email, password }) {
  const errors = [];

  if (!username?.trim()) errors.push('Username is required');
  else if (username.trim().length < 3) errors.push('Username must be at least 3 characters');
  else if (username.trim().length > 30) errors.push('Username cannot exceed 30 characters');
  else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  if (!email?.trim()) errors.push('Email is required');
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.push('Please provide a valid email');

  if (!password) errors.push('Password is required');
  else if (password.length < 8) errors.push('Password must be at least 8 characters');

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return {
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
}

export function validateLoginBody({ email, password }) {
  const errors = [];

  if (!email?.trim()) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
}
