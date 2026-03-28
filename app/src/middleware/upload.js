import multer from 'multer';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

// ─── Memory Storage (buffer → Cloudinary via upload_stream) ──────────────────
const memoryStorage = multer.memoryStorage();

// ─── File Filters ─────────────────────────────────────────────────────────────
const avatarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new AppError('Only image files are allowed for avatars.', 400), false);
};

const documentFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError('Only PDF and JPG files are allowed.', 400), false);
};

// ─── Multer Instances (buffer only) ──────────────────────────────────────────
const multerAvatar = multer({
  storage: memoryStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('avatar');

const multerDocument = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
}).single('document');

// ─── Helper: buffer → Cloudinary via upload_stream ───────────────────────────
const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 500));
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });

// ─── Avatar Upload Middleware ─────────────────────────────────────────────────
export const handleAvatarUpload = (req, res, next) => {
  multerAvatar(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      if (req.user.avatar?.publicId) {
        await cloudinary.uploader.destroy(req.user.avatar.publicId).catch(() => {});
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'productivity/avatars',
        public_id: `user_${req.user.id}_avatar`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
        ],
      });

      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

// ─── Document Upload Middleware ───────────────────────────────────────────────
export const handleDocumentUpload = (req, res, next) => {
  multerDocument(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      const isPdf = req.file.mimetype === 'application/pdf';
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `productivity/documents/${req.user.id}`,
        resource_type: isPdf ? 'raw' : 'image',
        use_filename: true,
        unique_filename: true,
      });

      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};