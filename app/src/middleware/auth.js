import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token (Bearer header or cookie)
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next(new AppError('You are not logged in. Please log in.', 401));

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Your session has expired. Please log in again.', 401));
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Check user still exists
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('The user belonging to this token no longer exists.', 401));

  // 4. Check password was not changed after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  // 5. Check email verified
  if (!user.isEmailVerified) {
    return next(new AppError('Please verify your email address before accessing this resource.', 403));
  }

  req.user = user;
  next();
});
