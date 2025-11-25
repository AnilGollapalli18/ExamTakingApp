import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "../contexts/ExamContext";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";

export default function ExamPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const examCtx = useExam();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [qid]: index | [indices] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMap, setReviewMap] = useState({}); // { [qid]: true }

  const timerRef = useRef(null);
  const finishedRef = useRef(false);

  const DEFAULT_DURATION = 30 * 60; // 30 minutes

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
    if (examCtx?.examDuration && Number.isFinite(examCtx.examDuration)) return Math.max(0, Number(examCtx.examDuration));
    return DEFAULT_DURATION;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ctxQs = examCtx?.questions ?? null;

        if (Array.isArray(ctxQs) && ctxQs.length > 0) {
          if (mounted) setQuestions(ctxQs);
        } else {
          const pending = sessionStorage.getItem("pendingExamQuestions");
          if (pending) {
            try {
              const parsed = JSON.parse(pending);
              if (Array.isArray(parsed) && parsed.length > 0) {
                if (mounted) setQuestions(parsed);
                try { sessionStorage.removeItem("pendingExamQuestions"); } catch (e) {}
              }
            } catch (e) {
              console.warn("Failed to parse pendingExamQuestions", e);
            }
          }
        }

        const ctxRemaining = typeof examCtx?.timeRemaining === "number" ? examCtx.timeRemaining : null;
        const ctxStartTs = typeof examCtx?.examStartTs === "number" ? examCtx.examStartTs : null;
        const pendingStart = readPendingStart();

        if (ctxRemaining != null) {
          setTimeRemaining(Math.max(0, Math.ceil(ctxRemaining)));
        } else if (ctxStartTs) {
          const elapsed = Math.floor((Date.now() - ctxStartTs) / 1000);
          setTimeRemaining(Math.max(0, getDuration() - elapsed));
        } else if (pendingStart) {
          const elapsed = Math.floor((Date.now() - pendingStart) / 1000);
          setTimeRemaining(Math.max(0, getDuration() - elapsed));
          try { sessionStorage.removeItem("pendingExamStartTs"); sessionStorage.removeItem("pendingExamStarted"); } catch (e) {}
        } else {
          setTimeRemaining(getDuration());
        }

      } catch (err) {
        console.error("ExamPage init failed", err);
        if (mounted) setError("Failed to load exam");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examCtx]);

  // low-drift timer, aligned to second boundaries, single timeout loop
  useEffect(() => {
    if (!Array.isArray(questions) || questions.length === 0) return;
    if (timeRemaining == null) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    finishedRef.current = false;
    let active = true;

    const computeRemaining = () => {
      const start = examCtx?.examStartTs || readPendingStart();
      const duration = getDuration();
      if (start && Number.isFinite(start)) {
        const remMs = start + duration * 1000 - Date.now();
        return Math.max(0, Math.ceil(remMs / 1000));
      }
      return Math.max(0, Math.ceil(timeRemaining));
    };

    const tick = () => {
      if (!active) return;
      const rem = computeRemaining();
      setTimeRemaining(rem);

      if (rem <= 0) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          (async () => {
            setAutoSubmitting(true);
            await handleSubmit(true);
            setAutoSubmitting(false);
          })();
        }
        return;
      }

      const start = examCtx?.examStartTs || readPendingStart();
      if (start && Number.isFinite(start)) {
        const remMs = start + getDuration() * 1000 - Date.now();
        const delay = Math.max(100, remMs % 1000 || 1000);
        timerRef.current = setTimeout(tick, delay);
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };

    tick();

    return () => {
      active = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, timeRemaining]);

  const formatTime = (sec) => {
    const s = Math.max(0, Number.isFinite(sec) ? Math.floor(sec) : 0);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const toggleReview = (qid) => setReviewMap((m) => ({ ...m, [qid]: !m[qid] }));

  const selectOption = (qid, idx, isMultiple = false) => {
    setAnswers((prev) => {
      const cur = prev[qid];
      if (!isMultiple) return { ...prev, [qid]: idx };
      const arr = Array.isArray(cur) ? [...cur] : [];
      const pos = arr.indexOf(idx);
      if (pos >= 0) arr.splice(pos, 1); else arr.push(idx);
      return { ...prev, [qid]: arr };
    });
  };

  const isAnswered = (qid) => {
    const v = answers[qid];
    if (v === undefined || v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  const jumpTo = (i) => setCurrentIndex(i);

  const computeScore = useCallback((qs, ans) => {
    let s = 0;
    for (const q of qs) {
      const sel = ans[q.id];
      if (sel === undefined || sel === null) continue;
      if (Array.isArray(sel)) {
        const selSorted = [...sel].sort().join(",");
        const corr = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort().join(",") : String(q.correctAnswer);
        if (selSorted === corr) s++;
      } else {
        if (q.correctAnswer !== undefined && q.correctAnswer !== null && sel === q.correctAnswer) s++;
      }
    }
    return s;
  }, []);

  async function handleSubmit(isAuto = false) {
    if (!questions || questions.length === 0) {
      setError("No questions to submit");
      return;
    }
    if (autoSubmitting) return;
    setAutoSubmitting(true);
    try {
      const total = questions.length;
      const score = computeScore(questions, answers);
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      const timeSpentSeconds = Math.max(0, getDuration() - (timeRemaining ?? 0));

      const perQuestionResults = questions.map((q) => {
        const opts = Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : Array.isArray(q.answers) ? q.answers : [];
        return {
          id: q.id,
          question: q.question,
          options: opts,
          correctAnswer: q.correctAnswer,
          selectedAnswer: answers[q.id] ?? null,
        };
      });

      const record = {
        id: `hist_${Date.now()}`,
        uid: currentUser?.uid ?? null,
        score,
        total,
        percentage,
        answers,
        createdAt: new Date().toISOString(),
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        category: examCtx?.category ?? "Mixed",
      };

      // attempt to send to API but ALWAYS persist locally so History shows every exam
      try {
        if (api && typeof api.saveExamResult === "function") {
          await api.saveExamResult(currentUser?.uid ?? null, record);
        } else if (api && typeof api.submitExam === "function") {
          await api.submitExam(record);
        }
      } catch (e) {
        console.warn("api.saveExamResult/submitExam failed:", e);
      }
      try {
        const raw = localStorage.getItem("examHistory");
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(record);
        localStorage.setItem("examHistory", JSON.stringify(arr.slice(0, 500)));
      } catch (e) {
        console.warn("Failed to write local exam history", e);
      }

      try {
        sessionStorage.removeItem("pendingExamQuestions");
        sessionStorage.removeItem("pendingExamStartTs");
        sessionStorage.removeItem("pendingExamStarted");
      } catch (e) {}

      navigate("/results", { state: { score, total, timeSpentSeconds, perQuestionResults } });
    } catch (err) {
      console.error("Submit failed", err);
      setError("Failed to submit exam");
    } finally {
      setAutoSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading exam...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!questions || questions.length === 0) return <div className="p-6">No questions found</div>;

  const currentQ = questions[currentIndex];
  const opts = Array.isArray(currentQ.options) ? currentQ.options : Array.isArray(currentQ.choices) ? currentQ.choices : Array.isArray(currentQ.answers) ? currentQ.answers : [];
  const isMultiple = currentQ.questionType === "multiple" || currentQ.questionType === "checkbox";
  const userSel = answers[currentQ.id] ?? null;

  const navTileStyle = (q) => {
    const answered = isAnswered(q.id);
    const review = !!reviewMap[q.id];
    if (review) return { background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fca5a5" };
    if (answered) return { background: "#d1fae5", color: "#065f46", border: "1px solid #86efac" };
    return { background: "#ffffff", color: "#111827", border: "1px solid #e5e7eb" };
  };

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      <div style={{ flex: 1, background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 0 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                style={{
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: currentIndex === 0 ? "#f9fafb" : "#ffffff",
                  cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                  color: "#111827",
                }}
              >
                Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex === questions.length - 1}
                style={{
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: currentIndex === questions.length - 1 ? "#f9fafb" : "#ffffff",
                  cursor: currentIndex === questions.length - 1 ? "not-allowed" : "pointer",
                  color: "#111827",
                }}
              >
                Next
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontFamily: "monospace" }}>{formatTime(timeRemaining)}</div>
            <button
              onClick={() => toggleReview(currentQ.id)}
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 10px",
                borderRadius: 6,
                background: reviewMap[currentQ.id] ? "#fecaca" : "#ffffff",
                cursor: "pointer",
                color: reviewMap[currentQ.id] ? "#7f1d1d" : "#111827",
              }}
            >
              {reviewMap[currentQ.id] ? "Unmark Review" : "Mark for Review"}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={autoSubmitting} style={{ background: "#16a34a", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
              {autoSubmitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>

        <h3 style={{ marginTop: 0 }}>Question {currentIndex + 1} / {questions.length}</h3>
        <div style={{ margin: "12px 0 18px", fontSize: 18 }}>{currentQ.question}</div>

        <div>
          {opts.map((opt, idx) => {
            const display = opt && typeof opt === "object" ? opt.text ?? opt.label ?? String(opt) : String(opt);
            const checked = Array.isArray(userSel) ? userSel.includes(idx) : userSel === idx;
            return (
              <label key={idx} style={{ display: "block", padding: 8, cursor: "pointer", borderRadius: 6, background: checked ? "#f0f9ff" : "transparent", marginBottom: 6 }}>
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={`q_${currentQ.id}`}
                  checked={!!checked}
                  onChange={() => selectOption(currentQ.id, idx, isMultiple)}
                  style={{ marginRight: 10 }}
                />
                <span>{display}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ width: 180 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Questions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {questions.map((q, i) => (
            <button
              key={q.id ?? i}
              onClick={() => jumpTo(i)}
              title={q.question}
              style={{ padding: 8, borderRadius: 6, textAlign: "center", cursor: "pointer", ...navTileStyle(q) }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#d1fae5" }} /> Answered
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#fee2e2" }} /> Marked for review
          </div>
        </div>
      </div>
    </div>
  );
}
