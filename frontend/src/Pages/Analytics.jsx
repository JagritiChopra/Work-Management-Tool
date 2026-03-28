import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDashboardAnalytics,
  getSessionAnalytics,
  getTaskAnalytics,
} from "../Services/analyticsService";
import { APP_THEME } from "../Theme/appTheme";
import { STATUS_ORDER, statusTheme } from "../Theme/taskTheme";
const compactDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const rangeDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const formatCompactDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return compactDateFormatter.format(date);
};

const formatRangeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return rangeDateFormatter.format(date);
};

const formatHours = (minutes = 0) => {
  const safeMinutes = Number(minutes) || 0;
  const hours = safeMinutes / 60;

  if (hours >= 10) return `${hours.toFixed(0)}h`;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${safeMinutes}m`;
};

const formatHourLabel = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}${suffix}`;
};

const buildTaskTimeline = (completedByDay = [], tasksByDay = []) => {
  const grouped = Object.fromEntries(
    completedByDay.map((item) => [
      item.date,
      {
        date: item.date,
        completed: item.completed || 0,
        created: 0,
        statuses: STATUS_ORDER.reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {}),
      },
    ])
  );

  tasksByDay.forEach((item) => {
    const date = item?._id?.date;
    const status = item?._id?.status;
    if (!date || !grouped[date]) return;

    grouped[date].created += item.count || 0;
    if (status) grouped[date].statuses[status] = item.count || 0;
  });

  return Object.values(grouped);
};

export default function Analytics() {
  const [dashboardData, setDashboardData] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, taskRes, sessionRes] = await Promise.all([
        getDashboardAnalytics(),
        getTaskAnalytics(),
        getSessionAnalytics(),
      ]);

      setDashboardData(dashboardRes.data?.data || null);
      setTaskData(taskRes.data?.data || null);
      setSessionData(sessionRes.data?.data || null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const analytics = useMemo(() => {
    const taskTimeline = buildTaskTimeline(taskData?.completedByDay, taskData?.tasksByDay);
    const sessionsByDay = sessionData?.sessionsByDay || [];
    const hourDistribution = sessionData?.hourDistribution || [];
    const completedPeak = Math.max(...taskTimeline.map((item) => item.completed), 1);
    const sessionPeak = Math.max(...sessionsByDay.map((item) => item.count), 1);
    const durationPeak = Math.max(...sessionsByDay.map((item) => item.totalDuration), 1);
    const hourPeak = Math.max(...hourDistribution.map((item) => item.count), 1);

    const hottestHour = hourDistribution.reduce(
      (current, slot) => ((slot.count || 0) > (current?.count || 0) ? slot : current),
      null
    );

    const taskSummary = taskData?.summary;
    const dashboardTasks = dashboardData?.tasks;
    const sessionSummary = sessionData?.summary;

    return {
      taskTimeline,
      completedPeak,
      sessionPeak,
      durationPeak,
      hourPeak,
      activeHour: hottestHour?.count ? formatHourLabel(hottestHour.hour) : "No data",
      taskSummaryCards: [
        {
          label: "Total tasks",
          value: taskSummary?.totalTasks ?? dashboardTasks?.total ?? 0,
          note: "All statuses across your task board",
        },
        {
          label: "Completed",
          value: taskSummary?.completedTotal ?? dashboardTasks?.distribution?.Complete ?? 0,
          note: "Tasks finished so far",
        },
        {
          label: "Completion rate",
          value: `${taskSummary?.completionRate ?? 0}%`,
          note: "Based on all tracked tasks",
        },
        {
          label: "Today on calendar",
          value: dashboardData?.today?.calendarTasks ?? 0,
          note: "Scheduled items for today",
        },
      ],
      sessionSummaryCards: [
        {
          label: "Sessions in 30 days",
          value: sessionSummary?.totalSessions ?? dashboardData?.sessions?.last30Days ?? 0,
          note: "Recorded focus sessions",
        },
        {
          label: "Focus time",
          value: formatHours(sessionSummary?.totalDuration ?? dashboardData?.sessions?.totalDuration ?? 0),
          note: "Total tracked duration",
        },
        {
          label: "Active days",
          value: sessionSummary?.activeDays ?? 0,
          note: "Days with at least one session",
        },
        {
          label: "Today sessions",
          value: dashboardData?.today?.sessions ?? 0,
          note: "Sessions logged today",
        },
      ],
      periodLabel: (() => {
        const start = taskData?.period?.start || sessionData?.period?.start;
        const end = taskData?.period?.end || sessionData?.period?.end;
        if (!start || !end) return "Last 30 days";
        return `${formatRangeDate(start)} - ${formatRangeDate(end)}`;
      })(),
      statusDistribution: taskSummary?.statusDistribution || {},
      sessionsByDay,
      hourDistribution,
    };
  }, [dashboardData, sessionData, taskData]);

  return (
    <div className="flex-1 flex flex-col gap-6 px-6 pt-16 pb-6 relative">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8ff6d0] mb-3">
                Productivity Analytics
              </p>
              <h1 className="text-4xl text-white font-light leading-tight">
                Read the shape of your work, not just the size of your backlog.
              </h1>
              <p className="text-[#bdc9c2] text-sm mt-3 max-w-xl">
                This page combines task, session, and dashboard analytics from your backend into one shared pulse.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 min-w-[220px]">
              <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">
                Peak focus hour
              </p>
              <p className="text-white text-3xl font-light mt-2">{analytics.activeHour}</p>
              <p className="text-[#7f8d85] text-sm mt-1">Most common session start in the last 30 days</p>
            </div>
          </div>
        </div>

        <aside className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <h2 className="text-2xl text-white mb-4">Window</h2>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">
                Reporting range
              </p>
              <p className="text-white text-lg mt-2 leading-relaxed">{analytics.periodLabel}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Completion</p>
                <p className="text-white text-2xl mt-1">{taskData?.summary?.completionRate ?? 0}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Avg/day</p>
                <p className="text-white text-2xl mt-1">{sessionData?.summary?.avgSessionsPerActiveDay ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Tasks today</p>
                <p className="text-white text-2xl mt-1">{dashboardData?.today?.calendarTasks ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Focus time</p>
                <p className="text-white text-2xl mt-1">{formatHours(sessionData?.summary?.totalDuration ?? 0)}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.taskSummaryCards.map((card) => (
          <div
            key={card.label}
            className={`${APP_THEME.classes.glassPanel} rounded-3xl p-5`}
          >
            <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">{card.label}</p>
            <p className="text-white text-3xl font-light mt-3">{loading ? "--" : card.value}</p>
            <p className="text-[#7f8d85] text-sm mt-2">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.sessionSummaryCards.map((card) => (
          <div
            key={card.label}
            className={`${APP_THEME.classes.glassPanel} rounded-3xl p-5`}
          >
            <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">{card.label}</p>
            <p className="text-white text-3xl font-light mt-3">{loading ? "--" : card.value}</p>
            <p className="text-[#7f8d85] text-sm mt-2">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl text-white">Task completion rhythm</h2>
              <p className="text-sm text-[#bdc9c2]">
                Completed tasks per day over the last 30 days.
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="h-[260px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
          ) : (
            <div className="grid grid-cols-10 md:grid-cols-15 gap-2 items-end min-h-[260px]">
              {analytics.taskTimeline.map((day) => (
                <div key={day.date} className="flex flex-col items-center justify-end gap-3 min-h-[260px]">
                  <div className="h-[210px] w-full flex items-end justify-center rounded-2xl border border-white/5 bg-white/[0.02] px-1.5 py-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-[#8ff6d0] to-[#73d9b5] shadow-[0_0_18px_rgba(143,246,208,0.15)]"
                      style={{ height: `${Math.max((day.completed / analytics.completedPeak) * 100, day.completed ? 10 : 4)}%` }}
                      title={`${formatCompactDate(day.date)}: ${day.completed} completed`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm">{day.completed}</p>
                    <p className="text-[11px] text-[#7f8d85] uppercase tracking-[0.16em] mt-1">
                      {formatCompactDate(day.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <h2 className="text-2xl text-white mb-4">Status mix</h2>
          <div className="space-y-4">
            {STATUS_ORDER.map((status) => {
              const count = analytics.statusDistribution[status] || 0;
              const total = taskData?.summary?.totalTasks || 0;
              const percent = total ? Math.round((count / total) * 100) : 0;

              return (
                <div key={status} className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b ${statusTheme[status].glow} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-3 py-1 rounded-full border text-xs ${statusTheme[status].pill}`}>
                      {status}
                    </span>
                    <span className="text-white text-sm">{count}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusTheme[status].fill}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[#bdc9c2] text-xs mt-2">{percent}% of all tasks</p>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <div className="mb-6">
            <h2 className="text-2xl text-white">Daily task intake</h2>
            <p className="text-sm text-[#bdc9c2]">
              New tasks created each day, grouped by workflow stage.
            </p>
          </div>

          {loading ? (
            <div className="h-[320px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
          ) : (
            <div className="space-y-3">
              {analytics.taskTimeline.slice(-8).reverse().map((day) => (
                <div key={day.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-white">{formatRangeDate(day.date)}</p>
                      <p className="text-sm text-[#7f8d85]">{day.created} task{day.created === 1 ? "" : "s"} created</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ORDER.map((status) => (
                        <span
                          key={status}
                          className={`px-3 py-1 rounded-full border text-xs ${statusTheme[status].pill}`}
                        >
                          {status}: {day.statuses[status] || 0}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <div className="mb-6">
            <h2 className="text-2xl text-white">Session volume</h2>
            <p className="text-sm text-[#bdc9c2]">
              Session count and tracked duration day by day.
            </p>
          </div>

          {loading ? (
            <div className="h-[320px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
          ) : (
            <div className="space-y-3">
              {analytics.sessionsByDay.slice(-8).reverse().map((day) => (
                <div key={day.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white">{formatRangeDate(day.date)}</p>
                      <p className="text-sm text-[#7f8d85]">
                        {day.count} session{day.count === 1 ? "" : "s"} • {formatHours(day.totalDuration)} tracked
                      </p>
                    </div>
                    <div className="w-24 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-end gap-1 p-2">
                      <div
                        className="flex-1 rounded-full bg-[#9dc4ff]"
                        style={{ height: `${Math.max((day.count / analytics.sessionPeak) * 100, day.count ? 20 : 8)}%` }}
                      />
                      <div
                        className="flex-1 rounded-full bg-[#8ff6d0]"
                        style={{ height: `${Math.max((day.totalDuration / analytics.durationPeak) * 100, day.totalDuration ? 20 : 8)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
        <div className="mb-6">
          <h2 className="text-2xl text-white">Focus hour distribution</h2>
          <p className="text-sm text-[#bdc9c2]">
            When your sessions most often begin across the day.
          </p>
        </div>

        {loading ? (
          <div className="h-[220px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {analytics.hourDistribution.map((slot) => (
              <div
                key={slot.hour}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#9dc4ff]/12 to-white/[0.02] p-4"
              >
                <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.18em]">
                  {formatHourLabel(slot.hour)}
                </p>
                <p className="text-white text-2xl mt-3">{slot.count}</p>
                <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9dc4ff] to-[#8ff6d0]"
                    style={{ width: `${Math.max((slot.count / analytics.hourPeak) * 100, slot.count ? 12 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



