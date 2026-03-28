import Folder from '../models/Folder.js';
import Document from '../models/Document.js';
import cloudinary from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

const buildPath = (parentPath, name) =>
  parentPath ? `${parentPath}/${name}` : name;

// ─── Create Folder ────────────────────────────────────────────────────────────
export const createFolder = catchAsync(async (req, res, next) => {
  const { name, parent = null, color } = req.body;

  let parentPath = '';
  if (parent) {
    const parentFolder = await Folder.findOne({ _id: parent, user: req.user._id });
    if (!parentFolder) return next(new AppError('Parent folder not found.', 404));
    parentPath = parentFolder.path;
  }

  const folder = await Folder.create({
    user: req.user._id,
    name,
    parent: parent || null,
    path: buildPath(parentPath, name),
    color,
  });

  sendSuccess(res, 201, { folder }, 'Folder created.');
});

// ─── Get All Folders ──────────────────────────────────────────────────────────
export const getFolders = catchAsync(async (req, res) => {
  const { parent } = req.query;
  const filter = { user: req.user._id };

  if (parent === 'root' || parent === null || parent === 'null') {
    filter.parent = null;
  } else if (parent) {
    filter.parent = parent;
  }

  const folders = await Folder.find(filter).sort('name').lean();

  // Enrich with document count
  const counts = await Document.aggregate([
    { $match: { user: req.user._id, folder: { $in: folders.map((f) => f._id) } } },
    { $group: { _id: '$folder', count: { $sum: 1 } } },
  ]);
  const countMap = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});
  folders.forEach((f) => { f.documentCount = countMap[f._id] || 0; });

  sendSuccess(res, 200, { folders });
});

// ─── Get Folder Tree ──────────────────────────────────────────────────────────
export const getFolderTree = catchAsync(async (req, res) => {
  const allFolders = await Folder.find({ user: req.user._id }).sort('name').lean();

  const buildTree = (folders, parentId = null) =>
    folders
      .filter((f) => String(f.parent) === String(parentId) || (!f.parent && !parentId))
      .map((f) => ({ ...f, children: buildTree(folders, f._id) }));

  sendSuccess(res, 200, { tree: buildTree(allFolders) });
});

// ─── Update Folder ────────────────────────────────────────────────────────────
export const updateFolder = catchAsync(async (req, res, next) => {
  const { name, color } = req.body;
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
  if (!folder) return next(new AppError('Folder not found.', 404));

  const oldPath = folder.path;
  if (name) {
    const parentPath = folder.parent
      ? (await Folder.findById(folder.parent))?.path || ''
      : '';
    folder.path = buildPath(parentPath, name);
    folder.name = name;
  }
  if (color) folder.color = color;

  await folder.save();

  // Update paths of all children
  if (name && oldPath !== folder.path) {
    await Folder.updateMany(
      { user: req.user._id, path: { $regex: `^${oldPath}/` } },
      [{ $set: { path: { $replaceAll: { input: '$path', find: oldPath + '/', replacement: folder.path + '/' } } } }]
    );
  }

  sendSuccess(res, 200, { folder }, 'Folder updated.');
});

// ─── Move Folder ──────────────────────────────────────────────────────────────
export const moveFolder = catchAsync(async (req, res, next) => {
  const { parent = null } = req.body;
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
  if (!folder) return next(new AppError('Folder not found.', 404));
  if (String(folder._id) === String(parent)) return next(new AppError('Cannot move folder into itself.', 400));

  let newParentPath = '';
  if (parent) {
    const parentFolder = await Folder.findOne({ _id: parent, user: req.user._id });
    if (!parentFolder) return next(new AppError('Destination folder not found.', 404));
    // Prevent circular nesting
    if (parentFolder.path.startsWith(folder.path + '/'))
      return next(new AppError('Cannot move a folder into its own descendant.', 400));
    newParentPath = parentFolder.path;
  }

  const oldPath = folder.path;
  folder.parent = parent;
  folder.path = buildPath(newParentPath, folder.name);
  await folder.save();

  // Update all children
  if (oldPath !== folder.path) {
    await Folder.updateMany(
      { user: req.user._id, path: { $regex: `^${oldPath}/` } },
      [{ $set: { path: { $replaceAll: { input: '$path', find: oldPath + '/', replacement: folder.path + '/' } } } }]
    );
  }

  sendSuccess(res, 200, { folder }, 'Folder moved.');
});

// ─── Delete Folder ────────────────────────────────────────────────────────────
export const deleteFolder = catchAsync(async (req, res, next) => {
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
  if (!folder) return next(new AppError('Folder not found.', 404));

  // Get all descendant folder IDs
  const allFolders = await Folder.find({ user: req.user._id, path: { $regex: `^${folder.path}(/|$)` } });
  const folderIds = allFolders.map((f) => f._id);

  // Delete documents in all subfolders from Cloudinary
  const docs = await Document.find({ user: req.user._id, folder: { $in: folderIds } });
  await Promise.allSettled(docs.map((d) => cloudinary.uploader.destroy(d.publicId, {
    resource_type: d.mimeType === 'application/pdf' ? 'raw' : 'image',
  })));

  await Document.deleteMany({ user: req.user._id, folder: { $in: folderIds } });
  await Folder.deleteMany({ _id: { $in: folderIds } });

  sendSuccess(res, 200, null, 'Folder and all contents deleted.');
});
