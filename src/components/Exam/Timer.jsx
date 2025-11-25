import React, { useEffect, useState, useRef } from "react";
import { useExam } from "../../contexts/ExamContext";

/*
  Improved timer:
  - Uses examStartTs or sessionStorage.pendingExamStartTs fallback
  - Uses examDuration (seconds) or DEFAULT_DURATION
  - Aligns ticks to second boundaries to reduce drift
  - Clamps display to zero (never negative)
  - Calls finish() once when time reaches zero
*/
export default function Timer() {
  const {
    timeRemaining: ctxTimeRemaining = null,
    examStarted = false,
    finish,
    examStartTs = null, // millis (optional)
    examDuration = null, // seconds (optional)
  } = useExam();

  const DEFAULT_DURATION = 30 * 60; // 30 minutes

  const [displaySeconds, setDisplaySeconds] = useState(() => {
    if (typeof ctxTimeRemaining === "number") return Math.max(0, Math.ceil(ctxTimeRemaining));
    if (examDuration && Number.isFinite(examDuration)) return Math.max(0, Math.ceil(examDuration));
    return DEFAULT_DURATION;
  });

  const timerRef = useRef(null);
  const finishedRef = useRef(false);

  const readPendingStart = () => {
    try {
      const raw = sessionStorage.getItem("pendingExamStartTs") || sessionStorage.getItem("pendingExamStarted");
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch (e) {
      return null;
    }
  };

  const getDuration = () => {
    if (examDuration && Number.isFinite(examDuration)) return Math.max(0, Number(examDuration));
    return DEFAULT_DURATION;
  };

  const computeRemaining = () => {
    const start = examStartTs || readPendingStart();
    const duration = getDuration();
    if (start && Number.isFinite(start)) {
      const remMs = start + duration * 1000 - Date.now();
      return Math.max(0, Math.ceil(remMs / 1000));
    }
    if (typeof ctxTimeRemaining === "number") return Math.max(0, Math.ceil(ctxTimeRemaining));
    return duration;
  };

  useEffect(() => {
    finishedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    let active = true;

    const tick = () => {
      if (!active) return;
      const rem = computeRemaining();
      // ensure non-negative
      const safeRem = Math.max(0, Number.isFinite(rem) ? rem : 0);
      setDisplaySeconds(safeRem);

      if (safeRem <= 0) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          if (typeof finish === "function") {
            // call finish async so UI thread isn't blocked
            Promise.resolve().then(() => finish()).catch((e) => console.warn("Timer.finish error", e));
          }
        }
        return;
      }

      // Align next tick to next second boundary when startTs is available
      const start = examStartTs || readPendingStart();
      if (start && Number.isFinite(start)) {
        const remMs = start + getDuration() * 1000 - Date.now();
        const delay = Math.max(100, remMs % 1000 || 1000);
        timerRef.current = setTimeout(tick, delay);
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };

    if (!examStarted) {
      setDisplaySeconds(computeRemaining());
      return () => {
        active = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
      };
    }

    tick();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    // re-run when these inputs change
  }, [examStarted, examStartTs, examDuration, ctxTimeRemaining, finish]);

  const pad = (n) => String(n).padStart(2, "0");
  const minutes = Math.floor((displaySeconds || 0) / 60);
  const seconds = (displaySeconds || 0) % 60;

  return <div className="text-sm font-mono">{examStarted ? `Time: ${pad(minutes)}:${pad(seconds)}` : `Time: ${pad(minutes)}:${pad(seconds)}`}</div>;
}
