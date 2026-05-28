import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateToken } from '../utils/generateToken.js';
import { validateSignupBody, validateLoginBody } from '../utils/validateAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
};

export const signup = asyncHandler(async (req, res) => {
  const body = validateSignupBody(req.body);

  const existingEmail = await User.findOne({ email: body.email });
  if (existingEmail) {
    throw new AppError('Email already in use', 409);
  }

  const existingUsername = await User.findOne({ username: body.username });
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  const user = await User.create(body);
  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = validateLoginBody(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  sendAuthResponse(res, user);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});
