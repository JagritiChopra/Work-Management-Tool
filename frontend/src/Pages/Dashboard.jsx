import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  bulkUpdateStatus,
  createTask,
  deleteTask,
  getKanban,
  updateTask,
} from "../Services/taskService";
import { APP_THEME } from "../Theme/appTheme";
import { FALLBACK_STATUSES, statusAccent, statusGlow } from "../Theme/taskTheme";
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const formatDate = (value) => {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return dateFormatter.format(date);
};

const findTaskById = (board, statuses, taskId) => {
  for (const status of statuses) {
    const task = (board[status] || []).find((item) => item._id === taskId);
    if (task) {
      return { status, task };
    }
  }

  return null;
};

const removeTaskFromBoard = (board, taskId) =>
  Object.fromEntries(
    Object.entries(board).map(([status, tasks]) => [
      status,
      (tasks || []).filter((task) => task._id !== taskId),
    ])
  );

const upsertTaskInBoard = (board, statuses, task) => {
  const nextBoard = removeTaskFromBoard(board, task._id);
  const targetStatus = task.status && statuses.includes(task.status) ? task.status : statuses[0];
  nextBoard[targetStatus] = [task, ...(nextBoard[targetStatus] || [])];
  return nextBoard;
};

export default function Dashboard() {
  const [board, setBoard] = useState({});
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To Do",
  });

  const syncBoardState = useCallback((nextBoard, nextStatuses) => {
    setBoard(nextBoard);
    setStatuses(nextStatuses);
    setSelectedIds((prev) =>
      prev.filter((id) =>
        nextStatuses.some((status) =>
          (nextBoard[status] || []).some((task) => task._id === id)
        )
      )
    );
    setActiveTaskId((prev) =>
      prev && nextStatuses.some((status) => (nextBoard[status] || []).some((task) => task._id === prev))
        ? prev
        : null
    );
  }, []);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getKanban();
      const nextBoard = res.data?.data?.board || {};
      const nextStatuses = res.data?.data?.statuses || FALLBACK_STATUSES;

      syncBoardState(nextBoard, nextStatuses);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load your tasks.");
    } finally {
      setLoading(false);
    }
  }, [syncBoardState]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allTasks = useMemo(
    () => statuses.flatMap((status) => board[status] || []),
    [board, statuses]
  );

  const filteredBoard = useMemo(() => {
    const query = search.trim().toLowerCase();

    return statuses.reduce((acc, status) => {
      const tasks = board[status] || [];
      acc[status] = query
        ? tasks.filter((task) =>
            `${task.title || ""} ${task.description || ""}`
              .toLowerCase()
              .includes(query)
          )
        : tasks;
      return acc;
    }, {});
  }, [board, search, statuses]);

  const summary = useMemo(() => {
    const total = allTasks.length;
    const completed = (board.Complete || []).length;
    const review = (board.Review || []).length;
    const inProgress = (board["In Progress"] || []).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, review, inProgress, completionRate };
  }, [allTasks.length, board]);

  const recentTasks = useMemo(
    () =>
      [...allTasks]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [allTasks]
  );

  const toggleSelected = useCallback((taskId) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const getMoveOptions = useCallback(
    (status) => statuses.filter((nextStatus) => nextStatus !== status),
    [statuses]
  );

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
      };
      const res = await createTask(payload);
      const createdTask =
        res.data?.data?.task ||
        res.data?.task ||
        null;

      if (createdTask?._id) {
        setBoard((prev) => upsertTaskInBoard(prev, statuses, createdTask));
      } else {
        await fetchBoard();
      }

      setForm({ title: "", description: "", status: "To Do" });
      setShowComposer(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    const located = findTaskById(board, statuses, taskId);
    if (!located || located.status === status) return;

    const nextTask = { ...located.task, status };
    const previousBoard = board;

    setActiveTaskId(null);
    setBoard((prev) => upsertTaskInBoard(prev, statuses, nextTask));

    try {
      await updateTask(taskId, { status });
    } catch (err) {
      console.error(err);
      setBoard(previousBoard);
      alert(err.response?.data?.message || "Failed to update task status.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    const previousBoard = board;
    setBoard((prev) => removeTaskFromBoard(prev, taskId));
    setActiveTaskId((prev) => (prev === taskId ? null : prev));
    setSelectedIds((prev) => prev.filter((id) => id !== taskId));

    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error(err);
      setBoard(previousBoard);
      alert(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleBulkMove = async (status) => {
    if (!selectedIds.length) return;

    const previousBoard = board;
    setSubmitting(true);
    setBoard((prev) => {
      const nextBoard = { ...prev };
      const movedTasks = [];

      for (const currentStatus of statuses) {
        const tasks = nextBoard[currentStatus] || [];
        const keptTasks = [];

        for (const task of tasks) {
          if (selectedIdSet.has(task._id) && task.status !== status) {
            movedTasks.push({ ...task, status });
          } else {
            keptTasks.push(task);
          }
        }

        nextBoard[currentStatus] = keptTasks;
      }

      nextBoard[status] = [...movedTasks, ...(nextBoard[status] || [])];
      return nextBoard;
    });
    setSelectedIds([]);
    setActiveTaskId(null);

    try {
      await bulkUpdateStatus({ ids: selectedIds, status });
    } catch (err) {
      console.error(err);
      setBoard(previousBoard);
      alert(err.response?.data?.message || "Failed to move selected tasks.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-6 pt-16 pb-6 relative">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8ff6d0] mb-3">
                Task Dashboard
              </p>
              <h1 className="text-4xl text-white font-light leading-tight">
                Keep every task moving from idea to done.
              </h1>
              <p className="text-[#bdc9c2] text-sm mt-3 max-w-xl">
                Your backend already supports task CRUD, kanban grouping, and bulk
                status updates, so this dashboard is built as a live command center
                around that workflow.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 min-w-[220px]">
              <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">
                Active focus
              </p>
              <p className="text-white text-3xl font-light mt-2">{summary.inProgress}</p>
              <p className="text-[#7f8d85] text-sm mt-1">tasks currently in progress</p>
            </div>
          </div>
        </div>

        <aside className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
          <h2 className="text-2xl text-white mb-4">Overview</h2>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[#bdc9c2] text-xs uppercase tracking-[0.2em]">
                Completion
              </p>
              <p className="text-white text-3xl font-light mt-2">
                {summary.completionRate}%
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ff6d0] to-[#73d9b5]"
                  style={{ width: `${summary.completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Total</p>
                <p className="text-white text-2xl mt-1">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Done</p>
                <p className="text-white text-2xl mt-1">{summary.completed}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">In Progress</p>
                <p className="text-white text-2xl mt-1">{summary.inProgress}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[#bdc9c2] text-xs">Review</p>
                <p className="text-white text-2xl mt-1">{summary.review}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className={`${APP_THEME.classes.glassPanel} rounded-3xl p-4 md:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl text-white">Board</h2>
            <p className="text-sm text-[#bdc9c2]">
              Select multiple tasks to move them together, or click a card to open move actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#7f8d85] outline-none"
            />
            <button
              onClick={() => setShowComposer(true)}
              className={`px-4 py-2.5 rounded-xl ${APP_THEME.classes.primaryButton}`}
            >
              New task
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleBulkMove(status)}
                disabled={!selectedIds.length || submitting}
                className={`px-4 py-2.5 rounded-xl border text-sm transition ${
                  selectedIds.length
                    ? "border-[#8ff6d0]/30 bg-[#8ff6d0]/10 text-[#8ff6d0]"
                    : "border-white/10 bg-white/5 text-[#6f7e77]"
                }`}
              >
                Move to {status}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : loading ? (
          <div className="grid gap-4 mt-6 xl:grid-cols-4">
            {statuses.map((status) => (
              <div
                key={status}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 min-h-[260px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 mt-6 xl:grid-cols-4">
            {statuses.map((status) => {
              const tasks = filteredBoard[status] || [];

              return (
                <div
                  key={status}
                  className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b ${statusGlow[status] || statusGlow["To Do"]} p-4 min-h-[320px]`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg text-white">{status}</h3>
                      <p className="text-xs text-[#bdc9c2]">
                        {(board[status] || []).length} total
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full border text-xs ${
                        statusAccent[status] || statusAccent["To Do"]
                      }`}
                    >
                      {tasks.length} shown
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-[#7f8d85]">
                        No tasks here.
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <article
                          key={task._id}
                          onClick={() =>
                            setActiveTaskId((prev) => (prev === task._id ? null : task._id))
                          }
                          className={`rounded-2xl border p-4 cursor-pointer transition ${
                            activeTaskId === task._id
                              ? "border-[#8ff6d0]/30 bg-[#071310]/90"
                              : "border-white/10 bg-[#050505]/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIdSet.has(task._id)}
                              onChange={() => toggleSelected(task._id)}
                              onClick={(event) => event.stopPropagation()}
                              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-white text-sm font-medium">
                                    {task.title}
                                  </h4>
                                  <p className="text-[#7f8d85] text-xs mt-1">
                                    Created {formatDate(task.createdAt)}
                                  </p>
                                </div>

                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteTask(task._id);
                                  }}
                                  className="text-xs text-[#bdc9c2] hover:text-white"
                                >
                                  Delete
                                </button>
                              </div>

                              <p className="text-sm text-[#d0dad4] mt-3 whitespace-pre-wrap">
                                {task.description?.trim() || "No description yet."}
                              </p>

                              {activeTaskId === task._id && (
                                <div
                                  className="mt-4 pt-4 border-t border-white/10"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#7f8d85] mb-3">
                                    Move task to
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {getMoveOptions(task.status).map((nextStatus) => (
                                      <button
                                        key={nextStatus}
                                        onClick={() => handleStatusChange(task._id, nextStatus)}
                                        className={`px-3 py-1 rounded-full border text-xs transition ${
                                          statusAccent[nextStatus] || statusAccent["To Do"]
                                        }`}
                                      >
                                        {nextStatus}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${APP_THEME.classes.glassPanel} rounded-3xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl text-white">Recent tasks</h2>
            <p className="text-sm text-[#bdc9c2]">
              A quick read on the newest work items in your queue.
            </p>
          </div>
          <button
            onClick={fetchBoard}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recentTasks.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-[#7f8d85]">
              Create your first task to populate the dashboard.
            </div>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task._id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <span
                  className={`inline-flex px-3 py-1 rounded-full border text-xs ${
                    statusAccent[task.status] || statusAccent["To Do"]
                  }`}
                >
                  {task.status}
                </span>
                <h3 className="text-white mt-3">{task.title}</h3>
                <p className="text-sm text-[#bdc9c2] mt-2 line-clamp-3">
                  {task.description?.trim() || "No description yet."}
                </p>
                <p className="text-xs text-[#7f8d85] mt-3">
                  {formatDate(task.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {showComposer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-lg p-6 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1] shadow-[0_0_40px_rgba(143,246,208,0.15)]"
          >
            <h2 className="text-white text-2xl">Create task</h2>
            <p className="text-sm text-[#bdc9c2] mt-2">
              New tasks post straight into the task backend and appear on the board
              after save.
            </p>

            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Task title"
              className="w-full mt-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#7f8d85] outline-none"
            />

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="w-full mt-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#7f8d85] outline-none resize-none"
            />

            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              className="w-full mt-3 px-4 py-3 rounded-2xl bg-[#111] border border-white/10 text-white outline-none"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 text-sm bg-white/5 rounded-xl text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.title.trim()}
                className={`px-5 py-2 text-sm rounded-xl ${APP_THEME.classes.primaryButton} disabled:opacity-60`}
              >
                {submitting ? "Saving..." : "Save task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}



