import crypto from 'crypto';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { sendEmail } from '../utils/email.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setCookies,
  clearCookies,
} from '../utils/tokenUtils.js';

const sendAuthResponse = (res, statusCode, user, message = 'Success') => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  setCookies(res, accessToken, refreshToken);
  sendSuccess(res, statusCode, { user: user.toSafeObject(), accessToken }, message);
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email }).select('+isEmailVerified');
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ name, email, password });
  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      templateName: 'verification',
      templateData: { name: user.name, url: verifyURL },
    });
  } catch {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send verification email. Please try again.', 500));
  }

  sendSuccess(res, 201, { email: user.email }, 'Registration successful. Please check your email to verify your account.');
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user, 'Email verified successfully.');
});

// ─── Resend Verification Email ────────────────────────────────────────────────
export const resendVerificationEmail = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
    .select('+emailVerificationToken +emailVerificationExpires +isEmailVerified');

  if (!user) return next(new AppError('No account found with that email.', 404));
  if (user.isEmailVerified) return next(new AppError('This email is already verified.', 400));

  // Prevent spam: only allow resend if previous token expired or doesn't exist
  if (user.emailVerificationExpires && user.emailVerificationExpires > Date.now()) {
    return next(new AppError('A verification email was recently sent. Please check your inbox.', 429));
  }

  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
  await sendEmail({ to: user.email, templateName: 'verification', templateData: { name: user.name, url: verifyURL } });

  sendSuccess(res, 200, null, 'Verification email resent. Please check your inbox.');
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // Prune old refresh tokens (keep latest 5)
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens = user.refreshTokens.slice(-4);
  }

  const refreshToken = signRefreshToken(user._id);
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user, 'Logged in successfully.');
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }
  }

  clearCookies(res);
  sendSuccess(res, 200, null, 'Logged out successfully.');
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return next(new AppError('No refresh token provided.', 401));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) return next(new AppError('User not found.', 401));

  const tokenExists = user.refreshTokens.some((t) => t.token === token);
  if (!tokenExists) return next(new AppError('Refresh token reuse detected. Please log in again.', 401));

  // Rotate: remove old, add new
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
  const newRefresh = signRefreshToken(user._id);
  user.refreshTokens.push({ token: newRefresh });
  await user.save({ validateBeforeSave: false });

  const newAccess = signAccessToken(user._id);
  setCookies(res, newAccess, newRefresh);
  sendSuccess(res, 200, { accessToken: newAccess }, 'Token refreshed.');
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
    .select('+passwordResetToken +passwordResetExpires');

  // Always respond the same to prevent user enumeration
  if (!user) {
    return sendSuccess(res, 200, null, 'If that email exists, a reset link has been sent.');
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

  try {
    await sendEmail({ to: user.email, templateName: 'resetPassword', templateData: { name: user.name, url: resetURL } });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send reset email. Please try again.', 500));
  }

  sendSuccess(res, 200, null, 'If that email exists, a reset link has been sent.');
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  await sendEmail({ to: user.email, templateName: 'passwordChanged', templateData: { name: user.name } });

  sendSuccess(res, 200, null, 'Password reset successful. Please log in with your new password.');
});

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all other sessions
  await user.save();

  sendAuthResponse(res, 200, user, 'Password changed successfully.');
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, 200, { user: req.user.toSafeObject() });
});
