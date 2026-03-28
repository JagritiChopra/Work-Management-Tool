import cloudinary from '../config/cloudinary.js';
import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ─── Upload Document ──────────────────────────────────────────────────────────
export const uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a file.', 400));

  const { folder = null, description, tags } = req.body;

  if (folder) {
    const folderExists = await Folder.findOne({ _id: folder, user: req.user._id });
    if (!folderExists) return next(new AppError('Folder not found.', 404));
  }

  const parsedTags = tags
    ? (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags)
    : [];

  const doc = await Document.create({
    user: req.user._id,
    folder: folder || null,
    name: req.body.name || req.file.originalname,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: req.file.cloudinaryUrl,
    publicId: req.file.cloudinaryPublicId,
    description,
    tags: parsedTags,
  });

  sendSuccess(res, 201, { document: doc }, 'Document uploaded successfully.');
});

// ─── Get Documents ────────────────────────────────────────────────────────────
export const getDocuments = catchAsync(async (req, res) => {
  const { folder, page = 1, limit = 20, search } = req.query;

  const filter = { user: req.user._id };
  if (folder === 'root' || folder === 'null') filter.folder = null;
  else if (folder) filter.folder = folder;

  if (search) filter.name = { $regex: search, $options: 'i' };

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate('folder', 'name path color')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Document.countDocuments(filter),
  ]);

  sendSuccess(res, 200, { documents }, 'Documents fetched.', {
    total, page: parseInt(page, 10), limit: parseInt(limit, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

// ─── Get Single Document ──────────────────────────────────────────────────────
export const getDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id })
    .populate('folder', 'name path color')
    .lean();
  if (!doc) return next(new AppError('Document not found.', 404));
  sendSuccess(res, 200, { document: doc });
});

// ─── Update Document Metadata ─────────────────────────────────────────────────
export const updateDocument = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'description', 'tags', 'folder'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (updates.folder !== undefined) {
    if (updates.folder && updates.folder !== 'null') {
      const folderExists = await Folder.findOne({ _id: updates.folder, user: req.user._id });
      if (!folderExists) return next(new AppError('Folder not found.', 404));
    } else {
      updates.folder = null;
    }
  }

  if (!Object.keys(updates).length) return next(new AppError('No valid fields to update.', 400));

  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('folder', 'name path color');

  if (!doc) return next(new AppError('Document not found.', 404));
  sendSuccess(res, 200, { document: doc }, 'Document updated.');
});

// ─── Replace Document File ────────────────────────────────────────────────────
export const replaceDocument = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a replacement file.', 400));

  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) return next(new AppError('Document not found.', 404));

  // Delete old file from Cloudinary
  await cloudinary.uploader.destroy(doc.publicId, {
    resource_type: doc.mimeType === 'application/pdf' ? 'raw' : 'image',
  }).catch(() => {});

  doc.url = req.file.cloudinaryUrl;
  doc.publicId = req.file.cloudinaryPublicId;
  doc.mimeType = req.file.mimetype;
  doc.size = req.file.size;
  doc.originalName = req.file.originalname;
  await doc.save();

  sendSuccess(res, 200, { document: doc }, 'Document file replaced.');
});

// ─── Delete Document ──────────────────────────────────────────────────────────
export const deleteDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) return next(new AppError('Document not found.', 404));

  await cloudinary.uploader.destroy(doc.publicId, {
    resource_type: doc.mimeType === 'application/pdf' ? 'raw' : 'image',
  }).catch(() => {});

  await doc.deleteOne();
  sendSuccess(res, 200, null, 'Document deleted.');
});

// ─── Move Document ────────────────────────────────────────────────────────────
export const moveDocument = catchAsync(async (req, res, next) => {
  const { folder = null } = req.body;

  if (folder) {
    const folderExists = await Folder.findOne({ _id: folder, user: req.user._id });
    if (!folderExists) return next(new AppError('Destination folder not found.', 404));
  }

  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { folder: folder || null },
    { new: true }
  );
  if (!doc) return next(new AppError('Document not found.', 404));
  sendSuccess(res, 200, { document: doc }, 'Document moved.');
});
