import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as api from "../services/api";
import { useAuth } from "./AuthContext";

const ExamContext = createContext(null);

export function ExamProvider({ children }) {
  const { currentUser } = useAuth?.() || {};
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examDuration, setExamDuration] = useState(0); // seconds
  const [examStartTs, setExamStartTs] = useState(null); // ms epoch
  const timerRef = useRef(null);

  const loadQuestions = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const qs = await api.getQuestions(options);
      const normalized = (qs || []).map((q, i) => ({
        id: q.id ?? q._id ?? String(i),
        question: q.question,
        options: q.options ?? [],
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : null,
        category: q.category ?? "",
        difficulty: q.difficulty ?? ""
      }));
      setQuestions(normalized);
      setCurrentIndex(0);
      setAnswers({});
      setExamCompleted(false);
      return normalized;
    } finally {
      setLoading(false);
    }
  }, []);

  const setAnswer = useCallback((questionId, selectedIndex) => {
    if (!questionId) return;
    setAnswers((prev) => {
      if (prev[questionId] === selectedIndex) return prev;
      return { ...prev, [questionId]: selectedIndex };
    });
  }, []);

  const clearAnswers = useCallback(() => setAnswers({}), []);

  const startExam = useCallback((durationSeconds = 30 * 60) => {
    // start timer and record start timestamp/duration
    setExamDuration(durationSeconds);
    setExamStartTs(Date.now());
    setExamStarted(true);
    setExamCompleted(false);
    setTimeRemaining(durationSeconds);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // auto-finish (do not await)
          finish({ submitToServer: true }).catch((e) => console.warn("auto-finish failed:", e));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []); // finish will be available via closure later

  const finish = useCallback(
    async ({ submitToServer = true } = {}) => {
      const qs = questions || [];
      let score = 0;
      const total = qs.length;
      for (const q of qs) {
        const selected = answers[q.id];
        if (selected !== undefined && q.correctAnswer !== null) {
          if (selected === q.correctAnswer) score++;
        }
      }

      // compute time spent (seconds)
      const now = Date.now();
      let timeSpentSeconds = null;
      if (examStartTs && examDuration) {
        // prefer timestamp
        timeSpentSeconds = Math.round((now - examStartTs) / 1000);
        // cap at duration
        if (timeSpentSeconds > examDuration) timeSpentSeconds = examDuration;
      } else if (examDuration) {
        timeSpentSeconds = examDuration - (timeRemaining || 0);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setExamCompleted(true);
      setExamStarted(false);

      if (submitToServer && typeof api.saveExamResult === "function") {
        // fire-and-forget but await if you want guaranteed persistence
        try {
          await api.saveExamResult({
            uid: currentUser?.uid ?? null,
            email: currentUser?.email ?? null,
            score,
            total,
            answers,
            category: "JavaScript/React",
            timeSpentSeconds
          }, { timeoutMs: 10000 });
        } catch (err) {
          console.warn("saveExamResult failed in finish:", err);
        }
      }

      return { score, total, timeSpentSeconds };
    },
    [questions, answers, examStartTs, examDuration, timeRemaining, currentUser]
  );

  const resetExam = useCallback(() => {
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setExamStarted(false);
    setExamCompleted(false);
    setTimeRemaining(0);
    setExamDuration(0);
    setExamStartTs(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const value = {
    questions,
    answers,
    currentIndex,
    setCurrentIndex,
    loading,
    examStarted,
    examCompleted,
    timeRemaining,
    examDuration,
    examStartTs,
    loadQuestions,
    setAnswer,
    clearAnswers,
    startExam,
    finish,
    resetExam
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam must be used within ExamProvider");
  return ctx;
}
