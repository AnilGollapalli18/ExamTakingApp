import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// removed broken import of ../../data/realQuestions; use server fetch + local fallback below

const SAMPLE = [
  { id: "preview1", question: "What is 2 + 2?", options: ["3", "4", "5"], correctAnswer: 1 },
  { id: "preview2", question: "Which is NOT a React hook?", options: ["useState", "useEffect", "useRender"], correctAnswer: 2 },
  { id: "preview3", question: "What does '===' do in JavaScript?", options: ["Assignment", "Strict equality", "Type conversion"], correctAnswer: 1 }
];

export default function SamplePreview() {
  const [questions, setQuestions] = useState(SAMPLE);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loadingReal, setLoadingReal] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMap, setReviewMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setQuestions(SAMPLE); // ensure preview uses only sample MCQs
  }, []);

  const handleSelect = (qid, idx) => {
    if (submitted) return;
    setAnswers((s) => ({ ...s, [qid]: idx }));
  };

  const handleSubmitSample = () => {
    let s = 0;
    for (const q of questions) {
      const sel = answers[q.id];
      if (sel !== undefined && sel === q.correctAnswer) s++;
    }
    setScore(s);
    setSubmitted(true);
  };

  const toggleReview = (qid) => {
    setReviewMap((m) => ({ ...m, [qid]: !m[qid] }));
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  const jumpTo = (i) => setCurrentIndex(i);

  // local fallback real questions (used only if server fetch fails)
  const CLIENT_REAL_FALLBACK = [
    { id: "q1", question: "What is typeof NaN in JavaScript?", options: ["number", "NaN", "undefined", "object"], correctAnswer: 0 },
    { id: "q2", question: "Which array method returns a new array and does NOT mutate the original?", options: ["splice", "push", "slice", "reverse"], correctAnswer: 2 },
    { id: "q3", question: "What will be logged by: for (var i=0;i<3;i++){ setTimeout(()=>console.log(i),0); }", options: ["0 1 2", "3 3 3", "undefined", "Error"], correctAnswer: 1 },
    { id: "q4", question: "Which statement about Promise.race is true?", options: ["Resolves when all resolve", "Settles with first settled promise", "Cancels remaining promises", "Returns synchronous value"], correctAnswer: 1 },
    { id: "q5", question: "Which creates a shallow copy of an object?", options: ["Object.assign({}, obj)", "JSON.parse(JSON.stringify(obj))", "{ ...obj }", "Both A and C"], correctAnswer: 3 },
    { id: "q6", question: "Value of this inside an arrow function is:", options: ["Dynamically bound", "Lexical (from surrounding scope)", "Always undefined", "Global object"], correctAnswer: 1 },
    { id: "q7", question: "Where should data-fetching side effects live in a functional React component?", options: ["Inside render return()", "Inside useEffect with dependencies", "Inside useState initializer", "Inside props"], correctAnswer: 1 },
    { id: "q8", question: "Purpose of keys when rendering lists in React:", options: ["Identify changed/added/removed items", "Enable CSS styling", "Prevent event handlers", "Set component id attribute"], correctAnswer: 0 },
    { id: "q9", question: "Which hook memoizes an expensive calculation between renders?", options: ["useEffect", "useMemo", "useState", "useRef"], correctAnswer: 1 },
    { id: "q10", question: "How to avoid child re-renders when passing inline function props?", options: ["Wrap function in useCallback", "Use setTimeout", "Convert to class component", "Use PropTypes"], correctAnswer: 0 },
    { id: "q11", question: "Controlled vs uncontrolled inputs in React:", options: ["Controlled use state; uncontrolled use refs/DOM", "Controlled are read-only", "Uncontrolled cannot handle events", "No difference"], correctAnswer: 0 },
    { id: "q12", question: "Best place to clean up subscriptions on unmount:", options: ["useEffect cleanup", "componentWillMount", "render", "constructor"], correctAnswer: 0 },
    { id: "q13", question: "Python slice a[1:5:2] means:", options: ["Start at 1, up to 5 exclusive, step 2", "From 1 to 5 inclusive step 2", "Skip first 5 elements", "Reverse"], correctAnswer: 0 },
    { id: "q14", question: "What prints for: def f(a=[]): a.append(1); return a; print(f()); print(f())", options: ["[1] then [1,1]", "[1] then [1]", "Error", "[1,1] then [1,1,1]"], correctAnswer: 0 },
    { id: "q15", question: "Create dict mapping numbers to squares 1..5 (Python):", options: ["{i: i*i for i in range(1,6)}", "{i*i for i in range(1,6)}", "dict(1..5)", "map(lambda x: x*x, range(1,6))"], correctAnswer: 0 }
  ];

  const startRealExam = async () => {
    setLoadingReal(true);
    setError("");
    try {
      const base = import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
      const url = `${base}/api/exam/questions?count=15`;
      console.log('[startRealExam] fetching', url);

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      console.log('[startRealExam] response status', res.status);

      let qs = null;
      if (res.ok) {
        const text = await res.text().catch(() => "");
        console.log('[startRealExam] raw response text (first 1000 chars):', text.slice(0, 1000));
        try {
          const json = JSON.parse(text);
          qs = json?.questions ?? json ?? [];
        } catch (e) {
          setError('Server returned non-JSON. See console for response snippet.');
          console.warn('[startRealExam] non-JSON response:', text.slice(0, 1000));
        }
      } else {
        const txt = await res.text().catch(() => "");
        console.warn('[startRealExam] non-OK response text:', txt.slice(0, 1000));
        if ((txt || "").toLowerCase().includes("no active")) {
          setError("No active exams available right now. Returning to dashboard...");
          setTimeout(() => navigate("/dashboard"), 1500);
          return;
        } else {
          setError(`Server error ${res.status}. See console.`);
        }
      }

      if (!Array.isArray(qs) || qs.length === 0) {
        console.log('[startRealExam] falling back to client seed');
        qs = CLIENT_REAL_FALLBACK.slice(0, 15);
      }

      console.log('[startRealExam] questions count', Array.isArray(qs) ? qs.length : typeof qs);
      // store a numeric start timestamp so the Exam page can compute remaining time correctly
      const startTs = Date.now();
      sessionStorage.setItem("pendingExamQuestions", JSON.stringify(qs));
      sessionStorage.setItem("pendingExamStarted", String(startTs));
      sessionStorage.setItem("pendingExamStartTs", String(startTs));
      console.log('[startRealExam] stored pendingExamQuestions (length)', JSON.parse(sessionStorage.getItem('pendingExamQuestions') || '[]').length);
      navigate("/exam");
    } catch (err) {
      console.error("startRealExam failed:", err);
      setError(err?.message || "Failed to load real exam questions — check console/network");
    } finally {
      setLoadingReal(false);
    }
  };

  // UI helpers for navigator tiles
  const tileStyle = (qid) => {
    const answered = answers[qid] !== undefined && answers[qid] !== null;
    const review = !!reviewMap[qid];
    if (review) return { background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fca5a5" }; // red
    if (answered) return { background: "#d1fae5", color: "#065f46", border: "1px solid #86efac" }; // green
    return { background: "#ffffff", color: "#111827", border: "1px solid #e5e7eb" }; // white
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4" style={{ display: "flex", gap: 20 }}>
        {/* Main question panel */}
        <div style={{ flex: 1, background: "#fff", padding: 20, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            {/* Left controls: Prev / Next */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={goPrev} disabled={currentIndex === 0} className="px-3 py-1 border rounded">Prev</button>
              <button onClick={goNext} disabled={currentIndex === questions.length - 1} className="px-3 py-1 border rounded">Next</button>
            </div>

            {/* Right controls: Mark review / Submit */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => toggleReview(currentQ.id)} className="px-3 py-1 border rounded" style={{ background: reviewMap[currentQ.id] ? "#fecaca" : "#fff" }}>
                {reviewMap[currentQ.id] ? "Unmark Review" : "Mark for Review"}
              </button>

              {!submitted ? (
                <button onClick={handleSubmitSample} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                  Submit Sample
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>Score: <strong>{score}/{questions.length}</strong></div>
                  <button onClick={startRealExam} disabled={loadingReal} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                    {loadingReal ? "Preparing exam..." : "Start Real Exam (15)"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Question content */}
          <div>
            <h2 style={{ marginTop: 0 }}>Question {currentIndex + 1} / {questions.length}</h2>
            <div style={{ margin: "12px 0 18px", fontSize: 18 }}>{currentQ?.question}</div>

            <div>
              {currentQ?.options?.map((opt, idx) => {
                const selected = answers[currentQ.id] === idx;
                return (
                  <label key={idx} className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${submitted ? (idx === currentQ.correctAnswer ? "bg-green-50" : selected ? "bg-red-50" : "") : ""}`} style={{ display: "block", padding: 8 }}>
                    <input
                      type="radio"
                      name={`q-${currentQ.id}`}
                      value={idx}
                      checked={selected || false}
                      onChange={() => handleSelect(currentQ.id, idx)}
                      disabled={submitted}
                      className="mr-3"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>

            {submitted && (
              <div className="mt-2 text-sm">
                Correct answer: <strong>{currentQ.options[currentQ.correctAnswer]}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right navigator */}
        <div style={{ width: 180 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => jumpTo(i)}
                title={q.question}
                style={{ padding: 8, borderRadius: 6, textAlign: "center", cursor: "pointer", ...tileStyle(q.id) }}
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

      {/* Error display */}
      {error && <div className="max-w-4xl mx-auto mt-4 text-sm text-red-600 px-4">{error}</div>}
    </div>
  );
}
