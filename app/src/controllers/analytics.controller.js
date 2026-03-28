import Task, { TASK_STATUSES } from '../models/Task.js';
import Session from '../models/Session.js';
import CalendarTask from '../models/CalendarTask.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getMonthRange = (monthsAgo = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
  return { start, end };
};

const getLast30Days = () => {
  const end = new Date();
  const start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
  return { start, end };
};

// ─── Task Analytics ───────────────────────────────────────────────────────────
export const getTaskAnalytics = catchAsync(async (req, res) => {
  const { start, end } = getLast30Days();

  // Tasks created per day grouped by status
  const tasksByDay = await Task.aggregate([
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  // Completed tasks per day (over last 30 days)
  const completedByDay = await Task.aggregate([
    {
      $match: {
        user: req.user._id,
        status: 'Complete',
        completedAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Status distribution (all time)
  const statusDistribution = await Task.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap = TASK_STATUSES.reduce((acc, s) => { acc[s] = 0; return acc; }, {});
  statusDistribution.forEach((s) => { statusMap[s._id] = s.count; });

  const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const completedTotal = statusMap['Complete'] || 0;
  const completionRate = totalTasks ? Math.round((completedTotal / totalTasks) * 100) : 0;

  // Fill in all 30 days (including zeros)
  const dayMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = { date: key, completed: 0 };
  }
  completedByDay.forEach((d) => { if (dayMap[d._id]) dayMap[d._id].completed = d.count; });

  sendSuccess(res, 200, {
    period: { start, end, days: 30 },
    summary: { totalTasks, completedTotal, completionRate, statusDistribution: statusMap },
    completedByDay: Object.values(dayMap),
    tasksByDay,
  });
});

// ─── Session Analytics ────────────────────────────────────────────────────────
export const getSessionAnalytics = catchAsync(async (req, res) => {
  const { start, end } = getLast30Days();

  // Sessions per day
  const sessionsByDay = await Session.aggregate([
    {
      $match: {
        user: req.user._id,
        dateKey: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateKey' } },
        count: { $sum: 1 },
        totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
        times: { $push: '$startTime' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Hour distribution (when do sessions most often start)
  const hourDistribution = await Session.aggregate([
    {
      $match: {
        user: req.user._id,
        dateKey: { $gte: start, $lte: end },
        startTime: { $exists: true },
      },
    },
    {
      $addFields: {
        hour: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } },
      },
    },
    { $group: { _id: '$hour', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Fill zeros for all 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  hourDistribution.forEach((h) => { hours[h._id].count = h.count; });

  // Fill zeros for all 30 days
  const dayMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = { date: key, count: 0, totalDuration: 0 };
  }
  sessionsByDay.forEach((d) => {
    if (dayMap[d._id]) { dayMap[d._id].count = d.count; dayMap[d._id].totalDuration = d.totalDuration; }
  });

  const totalSessions = sessionsByDay.reduce((s, d) => s + d.count, 0);
  const totalDuration = sessionsByDay.reduce((s, d) => s + d.totalDuration, 0);
  const activeDays = sessionsByDay.filter((d) => d.count > 0).length;
  const avgSessionsPerActiveDay = activeDays ? Math.round((totalSessions / activeDays) * 10) / 10 : 0;

  sendSuccess(res, 200, {
    period: { start, end, days: 30 },
    summary: { totalSessions, totalDuration, activeDays, avgSessionsPerActiveDay },
    sessionsByDay: Object.values(dayMap),
    hourDistribution: hours,
  });
});

// ─── Combined Dashboard Analytics ────────────────────────────────────────────
export const getDashboardAnalytics = catchAsync(async (req, res) => {
  const { start, end } = getLast30Days();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [
    taskStats,
    sessionStats,
    todayTasks,
    todaySessions,
  ] = await Promise.all([
    Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Session.aggregate([
      { $match: { user: req.user._id, dateKey: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: 1 }, totalDuration: { $sum: { $ifNull: ['$duration', 0] } } } },
    ]),
    CalendarTask.countDocuments({ user: req.user._id, date: { $gte: today, $lt: tomorrow } }),
    Session.countDocuments({ user: req.user._id, dateKey: today }),
  ]);

  const statusMap = TASK_STATUSES.reduce((acc, s) => { acc[s] = 0; return acc; }, {});
  taskStats.forEach((s) => { statusMap[s._id] = s.count; });

  sendSuccess(res, 200, {
    tasks: { distribution: statusMap, total: Object.values(statusMap).reduce((a, b) => a + b, 0) },
    sessions: {
      last30Days: sessionStats[0]?.total || 0,
      totalDuration: sessionStats[0]?.totalDuration || 0,
    },
    today: { calendarTasks: todayTasks, sessions: todaySessions },
  });
});
