import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCalendarTask,
  getCalendarTasks,
} from "../Services/calendarService";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatLocalDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTaskDateKey = (task) => {
  if (typeof task?.date === "string") {
    const match = task.date.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }

  return formatLocalDateKey(task?.date);
};

const getMonthData = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();

      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      ).toISOString();

      const res = await getCalendarTasks({ start, end });
      const data = res.data?.data?.tasks || res.data?.tasks || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
  }, [currentDate]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [fetchTasks]);

  const monthCells = useMemo(() => getMonthData(currentDate), [currentDate]);
  const todayStr = useMemo(() => formatLocalDateKey(new Date()), []);

  const tasksByDate = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        const key = getTaskDateKey(task);
        if (!key) return acc;

        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {}),
    [tasks]
  );

  const todayTasks = tasksByDate[todayStr] || [];

  const handleCreate = async () => {
    if (!selectedDate || !title.trim()) return;

    try {
      const res = await createCalendarTask({
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
      });

      const createdTask = res.data?.data?.task;
      if (createdTask) {
        setTasks((prev) => [...prev, createdTask]);
      } else {
        await fetchTasks();
      }

      setShowModal(false);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  return (
    <div className="flex-1 flex gap-6 px-6 pt-16 relative">
      <div className="flex-1 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl text-white font-light">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="px-3 py-2 bg-white/5 rounded-xl"
            >
              &#9664;
            </button>

            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white/5 rounded-xl text-sm">
              Today
            </button>

            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="px-3 py-2 bg-white/5 rounded-xl"
            >
              &#9654;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-[#bdc9c2] mb-2">
          {days.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {monthCells.map((date, index) => {
            if (!date) return <div key={index} />;

            const dateStr = formatLocalDateKey(date);
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowModal(true);
                }}
                className={`min-h-[100px] rounded-2xl p-3 border cursor-pointer ${
                  isToday
                    ? "bg-[#8ff6d0]/10 border-[#8ff6d0]/30 text-white"
                    : "bg-white/[0.03] border-white/[0.08] text-[#bdc9c2]"
                }`}
              >
                <div className="flex justify-between">
                  <span>{date.getDate()}</span>
                  {dayTasks.length > 0 && <div className="w-2 h-2 bg-[#8ff6d0] rounded-full" />}
                </div>

                <div className="mt-2 space-y-1">
                  {dayTasks.slice(0, 2).map((task, taskIndex) => (
                    <div
                      key={task._id || `${dateStr}-${taskIndex}`}
                      className="text-[10px] px-2 py-1 rounded bg-[#8ff6d0]/10 text-[#8ff6d0]"
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[320px] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6">
        <h3 className="text-2xl text-white mb-4">Today</h3>

        {todayTasks.length === 0 ? (
          <p className="text-[#bdc9c2] text-sm">No tasks today</p>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task, index) => (
              <div key={task._id || `today-${index}`} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white text-sm">{task.title}</p>
                <p className="text-xs text-[#bdc9c2]">{task.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="w-[380px] p-6 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1] shadow-[0_0_40px_rgba(143,246,208,0.15)]">
            <h3 className="text-white text-xl mb-4">Add Task - {selectedDate}</h3>

            <input
              placeholder="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full mb-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full mb-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-white/5 rounded-xl">
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="px-5 py-2 text-sm rounded-xl bg-gradient-to-br from-[#8ff6d0] to-[#73d9b5] text-[#002117] font-semibold disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

