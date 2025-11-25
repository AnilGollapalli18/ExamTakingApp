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
    <div style={{ display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", gap: 16, padding: "12px sm:20px", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Main Question Area */}
      <div style={{ flex: 1, background: "#fff", padding: "16px", borderRadius: 8, boxShadow: "0 0 8px rgba(0,0,0,0.05)" }} className="sm:p-6 lg:p-8">
        {/* Controls Header - Mobile Stack */}
        <div style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column-reverse" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 640 ? "stretch" : "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Navigation Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }} className="w-full sm:w-auto">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Timer and Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: window.innerWidth < 640 ? "space-between" : "flex-end" }} className="w-full sm:w-auto">
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", padding: "6px 12px", backgroundColor: timeRemaining && timeRemaining < 300 ? "#fee2e2" : "#f3f4f6", borderRadius: 6, color: timeRemaining && timeRemaining < 300 ? "#b91c1c" : "#111827" }}>
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={() => toggleReview(currentQ.id)}
              className="px-3 py-2 border border-gray-300 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: reviewMap[currentQ.id] ? "#fecaca" : "#ffffff",
                color: reviewMap[currentQ.id] ? "#7f1d1d" : "#111827",
                cursor: "pointer"
              }}
            >
              {reviewMap[currentQ.id] ? "Unmark" : "Mark"}
            </button>
            <button 
              onClick={() => handleSubmit(false)} 
              disabled={autoSubmitting} 
              className="px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {autoSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Question Number */}
        <h3 style={{ marginTop: 0, fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Question {currentIndex + 1} / {questions.length}</h3>

        {/* Question Text */}
        <div style={{ margin: "16px 0 24px", fontSize: "16px", lineHeight: "1.6", color: "#111827", fontWeight: "500" }} className="sm:text-lg">
          {currentQ.question}
        </div>

        {/* Options */}
        <div className="space-y-3 sm:space-y-4">
          {opts.map((opt, idx) => {
            const display = opt && typeof opt === "object" ? opt.text ?? opt.label ?? String(opt) : String(opt);
            const checked = Array.isArray(userSel) ? userSel.includes(idx) : userSel === idx;
            return (
              <label 
                key={idx} 
                style={{ 
                  display: "flex", 
                  padding: "12px", 
                  cursor: "pointer", 
                  borderRadius: 6, 
                  background: checked ? "#f0f9ff" : "transparent", 
                  border: `2px solid ${checked ? "#3b82f6" : "#e5e7eb"}`,
                  transition: "all 0.2s"
                }}
                className="hover:bg-gray-50"
              >
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={`q_${currentQ.id}`}
                  checked={!!checked}
                  onChange={() => selectOption(currentQ.id, idx, isMultiple)}
                  style={{ marginRight: 12, cursor: "pointer", minWidth: "20px", minHeight: "20px" }}
                  className="sm:mt-1"
                />
                <span style={{ fontSize: "14px", color: "#111827" }} className="sm:text-base">
                  <strong>{String.fromCharCode(65 + idx)}.</strong> {display}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Question Navigation Sidebar - Hidden on Mobile */}
      <div style={{ width: window.innerWidth < 768 ? "100%" : 160, minHeight: "auto" }} className="hidden md:block">
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: "14px", color: "#111827" }}>Questions</div>
        <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "repeat(auto-fill, minmax(50px, 1fr))" : "repeat(4, 1fr)", gap: 8 }}>
          {questions.map((q, i) => (
            <button
              key={q.id ?? i}
              onClick={() => jumpTo(i)}
              title={q.question}
              style={{ padding: 8, borderRadius: 6, textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: "600", ...navTileStyle(q) }}
              className="hover:shadow-md transition-shadow"
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#d1fae5", borderRadius: 2 }} /> Answered
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#fee2e2", borderRadius: 2 }} /> Review
          </div>
        </div>
      </div>

      {/* Mobile Question Navigation - Show on Mobile */}
      <div style={{ width: "100%", marginTop: 16 }} className="md:hidden">
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: "14px", color: "#111827" }}>All Questions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))", gap: 6 }}>
          {questions.map((q, i) => (
            <button
              key={q.id ?? i}
              onClick={() => jumpTo(i)}
              title={q.question}
              style={{ padding: 8, borderRadius: 6, textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: "600", ...navTileStyle(q) }}
              className="hover:shadow-md transition-shadow"
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
