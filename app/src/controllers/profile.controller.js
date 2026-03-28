import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = catchAsync(async (req, res, next) => {
  // Disallow password changes through this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Use /auth/change-password to update your password.', 400));
  }

  const allowedFields = ['name'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) {
    return next(new AppError('No valid fields provided for update.', 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, { user: user.toSafeObject() }, 'Profile updated successfully.');
});

// ─── Upload Avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image file.', 400));

  // Delete old avatar if exists
  const currentUser = await User.findById(req.user._id);
  if (currentUser.avatar?.publicId) {
    await cloudinary.uploader.destroy(currentUser.avatar.publicId).catch(() => {});
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: { url: req.file.cloudinaryUrl, publicId: req.file.cloudinaryPublicId } },
    { new: true }
  );

  sendSuccess(res, 200, { avatar: user.avatar }, 'Avatar updated successfully.');
});

// ─── Delete Avatar ────────────────────────────────────────────────────────────
export const deleteAvatar = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user.avatar?.publicId) return next(new AppError('No avatar to delete.', 400));

  await cloudinary.uploader.destroy(user.avatar.publicId);

  user.avatar = { url: null, publicId: null };
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, null, 'Avatar deleted successfully.');
});

// ─── Delete Account ───────────────────────────────────────────────────────────
export const deleteAccount = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(req.body.password))) {
    return res.status(400).json({ status: 'fail', message: 'Incorrect password.' });
  }

  // Soft delete
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

  sendSuccess(res, 200, null, 'Account deleted successfully.');
});
