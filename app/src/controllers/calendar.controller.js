import CalendarTask from '../models/CalendarTask.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

const buildDateRangeFilter = (query) => {
  const filter = {};
  if (query.start || query.end) {
    filter.date = {};
    if (query.start) filter.date.$gte = new Date(query.start);
    if (query.end) filter.date.$lte = new Date(query.end);
  } else if (query.month && query.year) {
    const month = parseInt(query.month, 10) - 1;
    const year = parseInt(query.year, 10);
    filter.date = {
      $gte: new Date(year, month, 1),
      $lte: new Date(year, month + 1, 0, 23, 59, 59),
    };
  }
  return filter;
};

// ─── Create Calendar Task ─────────────────────────────────────────────────────
export const createCalendarTask = catchAsync(async (req, res) => {
  const { title, description, date, startTime, endTime, color, allDay } = req.body;
  const task = await CalendarTask.create({
    user: req.user._id,
    title, description, date, startTime, endTime, color, allDay,
  });
  sendSuccess(res, 201, { task }, 'Calendar task created.');
});

// ─── Get Calendar Tasks ───────────────────────────────────────────────────────
export const getCalendarTasks = catchAsync(async (req, res) => {
  const filter = { user: req.user._id, ...buildDateRangeFilter(req.query) };

  const tasks = await CalendarTask.find(filter).sort('date startTime').lean();

  // Group by date string for calendar view
  const grouped = tasks.reduce((acc, task) => {
    const key = new Date(task.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  sendSuccess(res, 200, { tasks, grouped }, 'Calendar tasks fetched.', { total: tasks.length });
});

// ─── Get Single Calendar Task ─────────────────────────────────────────────────
export const getCalendarTask = catchAsync(async (req, res, next) => {
  const task = await CalendarTask.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!task) return next(new AppError('Calendar task not found.', 404));
  sendSuccess(res, 200, { task });
});

// ─── Update Calendar Task ─────────────────────────────────────────────────────
export const updateCalendarTask = catchAsync(async (req, res, next) => {
  const allowed = ['title', 'description', 'date', 'startTime', 'endTime', 'color', 'isCompleted', 'allDay'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) return next(new AppError('No valid fields to update.', 400));

  const task = await CalendarTask.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!task) return next(new AppError('Calendar task not found.', 404));
  sendSuccess(res, 200, { task }, 'Calendar task updated.');
});

// ─── Delete Calendar Task ─────────────────────────────────────────────────────
export const deleteCalendarTask = catchAsync(async (req, res, next) => {
  const task = await CalendarTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return next(new AppError('Calendar task not found.', 404));
  sendSuccess(res, 200, null, 'Calendar task deleted.');
});

// ─── Get Tasks by Date ────────────────────────────────────────────────────────
export const getTasksByDate = catchAsync(async (req, res, next) => {
  const date = new Date(req.params.date);
  if (isNaN(date)) return next(new AppError('Invalid date format.', 400));

  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);

  const tasks = await CalendarTask.find({
    user: req.user._id,
    date: { $gte: start, $lte: end },
  }).sort('startTime').lean();

  sendSuccess(res, 200, { tasks, date: req.params.date }, null, { total: tasks.length });
});
