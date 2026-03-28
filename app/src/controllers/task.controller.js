import Task, { TASK_STATUSES } from '../models/Task.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ─── Create Task ──────────────────────────────────────────────────────────────
export const createTask = catchAsync(async (req, res) => {
  const { title, description, status } = req.body;
  const task = await Task.create({ user: req.user._id, title, description, status });
  sendSuccess(res, 201, { task }, 'Task created successfully.');
});

// ─── Get All Tasks ────────────────────────────────────────────────────────────
export const getTasks = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20, sort = '-createdAt', search } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit, 10)).lean(),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, 200, { tasks }, 'Tasks fetched successfully.', {
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

// ─── Get Single Task ──────────────────────────────────────────────────────────
export const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!task) return next(new AppError('Task not found.', 404));
  sendSuccess(res, 200, { task });
});

// ─── Update Task ──────────────────────────────────────────────────────────────
export const updateTask = catchAsync(async (req, res, next) => {
  const allowedUpdates = ['title', 'description', 'status'];
  const updates = {};
  allowedUpdates.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) return next(new AppError('No valid fields to update.', 400));

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!task) return next(new AppError('Task not found.', 404));
  sendSuccess(res, 200, { task }, 'Task updated successfully.');
});

// ─── Delete Task ──────────────────────────────────────────────────────────────
export const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return next(new AppError('Task not found.', 404));
  sendSuccess(res, 200, null, 'Task deleted successfully.');
});

// ─── Bulk Update Status ───────────────────────────────────────────────────────
export const bulkUpdateStatus = catchAsync(async (req, res, next) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) return next(new AppError('Please provide task IDs.', 400));
  if (!TASK_STATUSES.includes(status)) return next(new AppError('Invalid status value.', 400));

  const result = await Task.updateMany(
    { _id: { $in: ids }, user: req.user._id },
    { status }
  );

  sendSuccess(res, 200, { modifiedCount: result.modifiedCount }, 'Tasks updated successfully.');
});

// ─── Get Kanban Board ─────────────────────────────────────────────────────────
export const getKanban = catchAsync(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort('createdAt').lean();

  const board = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  sendSuccess(res, 200, { board, statuses: TASK_STATUSES });
});
