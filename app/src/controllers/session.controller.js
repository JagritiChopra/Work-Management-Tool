import Session from '../models/Session.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ─── Create Session ───────────────────────────────────────────────────────────
export const createSession = catchAsync(async (req, res) => {
  const { date, startTime, endTime, notes } = req.body;
  const session = await Session.create({ user: req.user._id, date, startTime, endTime, notes });
  sendSuccess(res, 201, { session }, 'Session logged successfully.');
});

// ─── Get Sessions ─────────────────────────────────────────────────────────────
export const getSessions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, month, year, date } = req.query;
  const filter = { user: req.user._id };

  if (date) {
    const d = new Date(date);
    const dayKey = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    filter.dateKey = dayKey;
  } else if (month && year) {
    filter.dateKey = {
      $gte: new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1)),
      $lte: new Date(Date.UTC(parseInt(year), parseInt(month), 0)),
    };
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [sessions, total] = await Promise.all([
    Session.find(filter).sort('-date -startTime').skip(skip).limit(parseInt(limit, 10)).lean(),
    Session.countDocuments(filter),
  ]);

  sendSuccess(res, 200, { sessions }, 'Sessions fetched.', {
    total, page: parseInt(page, 10), limit: parseInt(limit, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

// ─── Dashboard: Sessions by Date ──────────────────────────────────────────────
export const getSessionDashboard = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month, 10) || now.getMonth() + 1;
  const y = parseInt(year, 10) || now.getFullYear();

  const startDate = new Date(Date.UTC(y, m - 1, 1));
  const endDate = new Date(Date.UTC(y, m, 0));

  const sessions = await Session.find({
    user: req.user._id,
    dateKey: { $gte: startDate, $lte: endDate },
  }).sort('dateKey startTime').lean();

  // Group by date key
  const byDate = sessions.reduce((acc, s) => {
    const key = s.dateKey.toISOString().split('T')[0];
    if (!acc[key]) acc[key] = { date: key, count: 0, sessions: [] };
    acc[key].count++;
    acc[key].sessions.push({ startTime: s.startTime, endTime: s.endTime, duration: s.duration, notes: s.notes });
    return acc;
  }, {});

  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgDuration = totalSessions ? Math.round(totalDuration / totalSessions) : 0;
  const activeDays = Object.keys(byDate).length;

  sendSuccess(res, 200, {
    month: m, year: y,
    summary: { totalSessions, totalDuration, avgDuration, activeDays },
    byDate: Object.values(byDate),
  });
});

// ─── Get Single Session ───────────────────────────────────────────────────────
export const getSession = catchAsync(async (req, res, next) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!session) return next(new AppError('Session not found.', 404));
  sendSuccess(res, 200, { session });
});

// ─── Update Session ───────────────────────────────────────────────────────────
export const updateSession = catchAsync(async (req, res, next) => {
  const allowed = ['date', 'startTime', 'endTime', 'notes'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) return next(new AppError('No valid fields to update.', 400));

  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!session) return next(new AppError('Session not found.', 404));
  sendSuccess(res, 200, { session }, 'Session updated.');
});

// ─── Delete Session ───────────────────────────────────────────────────────────
export const deleteSession = catchAsync(async (req, res, next) => {
  const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!session) return next(new AppError('Session not found.', 404));
  sendSuccess(res, 200, null, 'Session deleted.');
});
