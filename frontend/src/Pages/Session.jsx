import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSession } from "../Services/sessionService";

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function Session() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("countdown");
  const [selected, setSelected] = useState(1800);

  const intervalRef = useRef(null);
  const startRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = useCallback((skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmReset = window.confirm("Discard current session?");
      if (!confirmReset) return;
    }

    clearTimer();
    setTime(0);
    setIsRunning(false);
    startRef.current = null;
  }, []);

  const saveSession = useCallback(async () => {
    if (!startRef.current) return;

    const startTime = startRef.current;
    const endTime = new Date();

    try {
      await createSession({
        date: startTime.toISOString().split("T")[0],
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
      });

      alert("Session saved.");
      reset(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  }, [reset]);

  const startTimer = (initial, type) => {
    clearTimer();
    setMode(type);
    setTime(initial);
    setIsRunning(true);
    startRef.current = new Date();

    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        if (type === "countdown") {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        }

        return prev + 1;
      });
    }, 1000);
  };

  const pause = async () => {
    clearTimer();
    setIsRunning(false);

    const save = window.confirm("Save session? Cancel = discard");
    if (save) {
      await saveSession();
    } else {
      reset(true);
    }
  };

  useEffect(() => {
    if (mode === "countdown" && time === 0 && !isRunning && startRef.current) {
      const autoSaveId = window.setTimeout(() => {
        void saveSession();
      }, 0);

      return () => {
        window.clearTimeout(autoSaveId);
      };
    }
  }, [time, isRunning, mode, saveSession]);

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="flex-1 flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[360px] h-[360px] rounded-full border border-white/5" />

          <svg width="320" height="320" className="-rotate-90">
            <circle cx="160" cy="160" r="150" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="transparent" />
            <circle cx="160" cy="160" r="140" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="transparent" />

            <defs>
              <linearGradient id="grad">
                <stop offset="0%" stopColor="#8ff6d0" />
                <stop offset="100%" stopColor="#e9c400" />
              </linearGradient>
            </defs>

            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="url(#grad)"
              strokeWidth="4"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 140}
              strokeDashoffset={
                2 * Math.PI * 140 *
                (mode === "countdown" ? 1 - time / selected : Math.min(time / selected, 1))
              }
              style={{
                transition: "stroke-dashoffset 1s linear",
                filter: "drop-shadow(0 0 6px rgba(143,246,208,0.4))",
              }}
            />
          </svg>

          <div className="absolute text-center">
            <p className="text-[10px] tracking-[0.3em] text-[#bdc9c2] uppercase mb-2">Remaining</p>
            <div className="text-6xl text-white tracking-tight" style={{ fontFamily: "'Newsreader', serif", fontWeight: 200 }}>
              {formatTime(time)}
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap justify-center">
          {[
            { label: "30m", value: 1800 },
            { label: "1h", value: 3600 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSelected(item.value)}
              className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-[#bdc9c2] hover:text-white hover:bg-white/[0.06] transition-all"
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => startTimer(0, "countup")}
            className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-[#bdc9c2] hover:text-white hover:bg-white/[0.06]"
          >
            Infinity
          </button>
        </div>

        <div className="mt-12 flex gap-4">
          {!isRunning ? (
            <button
              onClick={() => startTimer(selected, "countdown")}
              className="px-8 py-3 rounded-2xl font-semibold text-sm bg-gradient-to-br from-[#8ff6d0] to-[#73d9b5] text-[#002117] hover:shadow-[0_0_25px_rgba(143,246,208,0.3)] transition-all"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pause}
              className="px-8 py-3 rounded-2xl text-sm bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all"
            >
              Pause
            </button>
          )}

          <button
            onClick={() => reset()}
            className="px-8 py-3 rounded-2xl text-sm border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

