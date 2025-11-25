import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h2>No results to show</h2>
        <p>No exam results were provided. Go back to dashboard or start an exam.</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 12px", borderRadius: 6 }}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const { score = 0, total = 0, timeSpentSeconds = 0, perQuestionResults = [] } = state;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const padTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const renderOptionLabel = (opt) => {
    if (opt == null) return "";
    if (typeof opt === "object") return opt.text ?? opt.label ?? String(opt);
    return String(opt);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px", minHeight: "100vh", backgroundColor: "#f9fafb" }} className="sm:py-12 sm:px-0">
      <header style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 640 ? "stretch" : "center", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }} className="sm:text-4xl">Exam Results</h1>
          <div style={{ color: "#374151", marginTop: 12, fontSize: "14px" }} className="sm:text-base">
            Score: <strong style={{ fontSize: "18px" }} className="sm:text-2xl">{score}</strong> / {total} — <strong>{percentage}%</strong>
            <div style={{ marginTop: 8, fontFamily: "monospace" }}>Time: {padTime(timeSpentSeconds)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="sm:flex-nowrap">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate("/history")} 
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            History
          </button>
        </div>
      </header>

      <main>
        <section style={{ marginBottom: 18, background: "#fff", borderRadius: 8, padding: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }} className="sm:p-6">
          <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "600" }} className="sm:text-xl">Summary</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#ecfdf5", color: "#065f46", flex: "1 1 120px", minWidth: 100, textAlign: "center", fontSize: "14px", fontWeight: "600" }} className="sm:text-base">
              Correct: {score}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#fff7ed", color: "#92400e", flex: "1 1 120px", minWidth: 100, textAlign: "center", fontSize: "14px", fontWeight: "600" }} className="sm:text-base">
              Total: {total}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#eef2ff", color: "#3730a3", flex: "1 1 120px", minWidth: 100, textAlign: "center", fontSize: "14px", fontWeight: "600" }} className="sm:text-base">
              {percentage}%
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f3f4f6", color: "#111827", flex: "1 1 140px", minWidth: 100, textAlign: "center", fontSize: "14px", fontWeight: "600" }} className="sm:text-base">
              {padTime(timeSpentSeconds)}
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ marginBottom: 12, fontSize: "18px", fontWeight: "600" }} className="sm:text-xl">Question by Question Review</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {perQuestionResults.map((q, i) => {
              const options = Array.isArray(q.options) ? q.options : [];
              const correct = q.correctAnswer;
              const selected = q.selectedAnswer;
              const isMultipleCorrect = Array.isArray(correct);
              const isMultipleSelected = Array.isArray(selected);

              const optionStatus = (idx) => {
                const isCorrect = isMultipleCorrect ? correct.includes(idx) : idx === correct;
                const isSelected = isMultipleSelected ? (selected || []).includes(idx) : selected === idx;
                return { isCorrect, isSelected };
              };

              const questionCardBorder = {
                border: "1px solid #e6e6e6",
                borderRadius: 8,
                padding: "16px",
                background: "#ffffff",
              };

              return (
                <div key={q.id ?? i} style={questionCardBorder}>
                  <div style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 640 ? "flex-start" : "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "15px" }} className="sm:text-base">#{i + 1} {q.question}</div>
                      <div style={{ marginTop: 12 }}>
                        {options.map((opt, idx) => {
                          const { isCorrect, isSelected } = optionStatus(idx);
                          const base = {
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 6,
                            marginBottom: 8,
                            border: "1px solid transparent",
                            background: "#fff",
                            fontSize: "14px"
                          };

                          if (isCorrect && isSelected) {
                            base.background = "#dcfce7";
                            base.border = "1px solid #86efac";
                          } else if (isCorrect) {
                            base.background = "#ecfdf5";
                            base.border = "1px solid #86efac";
                          } else if (isSelected && !isCorrect) {
                            base.background = "#fee2e2";
                            base.border = "1px solid #fca5a5";
                          } else if (isSelected) {
                            base.background = "#eff6ff";
                            base.border = "1px solid #bfdbfe";
                          }

                          return (
                            <div key={idx} style={base} className="sm:text-base">
                              <div style={{ width: 28, textAlign: "center", fontWeight: 700, color: isCorrect ? "#065f46" : "#111827", flexShrink: 0 }}>{String.fromCharCode(65 + idx)}</div>
                              <div style={{ flex: 1 }}>{renderOptionLabel(opt)}</div>
                              <div style={{ minWidth: 100, textAlign: "right", fontSize: 12, color: "#374151", flexShrink: 0 }} className="sm:text-sm">
                                {isCorrect && <span style={{ color: "#065f46", fontWeight: 600 }}>Correct</span>}
                                {!isCorrect && isSelected && <span style={{ color: "#b91c1c", fontWeight: 600 }}>Your answer</span>}
                              </div>
                            </div>
                          );
                        })}

                        <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }} className="sm:text-sm">
                          <div style={{ marginBottom: 6 }}>
                            Your selection:{" "}
                            <strong>
                              {selected == null || (Array.isArray(selected) && selected.length === 0)
                                ? "—"
                                : Array.isArray(selected)
                                ? selected.map((s) => String.fromCharCode(65 + s)).join(", ")
                                : String.fromCharCode(65 + selected)}
                            </strong>
                          </div>
                          <div>
                            Correct answer:{" "}
                            <strong>
                              {correct == null
                                ? "—"
                                : Array.isArray(correct)
                                ? correct.map((c) => String.fromCharCode(65 + c)).join(", ")
                                : String.fromCharCode(65 + correct)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ width: window.innerWidth < 640 ? "auto" : 100, textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: (Array.isArray(selected) ? JSON.stringify(selected) === JSON.stringify(correct) : selected === correct) ? "#065f46" : "#b91c1c", fontWeight: 700 }} className="sm:text-sm">
                        {(Array.isArray(selected) ? JSON.stringify(selected) === JSON.stringify(correct) : selected === correct) ? "✓ Correct" : "✗ Incorrect"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
