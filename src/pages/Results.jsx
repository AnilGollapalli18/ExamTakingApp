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
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Exam Results</h1>
          <div style={{ color: "#374151", marginTop: 6 }}>
            Score: <strong style={{ fontSize: 18 }}>{score}</strong> / {total} — <strong>{percentage}%</strong>
            <span style={{ marginLeft: 12, fontFamily: "monospace" }}>Time: {padTime(timeSpentSeconds)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 12px", borderRadius: 6 }}>Dashboard</button>
          <button onClick={() => navigate("/history")} style={{ padding: "8px 12px", borderRadius: 6 }}>History</button>
        </div>
      </header>

      <main>
        <section style={{ marginBottom: 18, background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#ecfdf5", color: "#065f46", minWidth: 120 }}>
              Correct: {score}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#fff7ed", color: "#92400e", minWidth: 120 }}>
              Total: {total}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#eef2ff", color: "#3730a3", minWidth: 120 }}>
              Percentage: {percentage}%
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f3f4f6", color: "#111827", minWidth: 140 }}>
              Time spent: {padTime(timeSpentSeconds)}
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ marginBottom: 8 }}>Question-by-question review</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {perQuestionResults.map((q, i) => {
              const options = Array.isArray(q.options) ? q.options : [];
              const correct = q.correctAnswer;
              const selected = q.selectedAnswer;
              const isMultipleCorrect = Array.isArray(correct);
              const isMultipleSelected = Array.isArray(selected);

              // helper to detect correctness per option
              const optionStatus = (idx) => {
                const isCorrect = isMultipleCorrect ? correct.includes(idx) : idx === correct;
                const isSelected = isMultipleSelected ? (selected || []).includes(idx) : selected === idx;
                return { isCorrect, isSelected };
              };

              const questionCardBorder = {
                border: "1px solid #e6e6e6",
                borderRadius: 8,
                padding: 12,
                background: "#ffffff",
              };

              return (
                <div key={q.id ?? i} style={questionCardBorder}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>#{i + 1} {q.question}</div>
                      <div style={{ marginTop: 8 }}>
                        {options.map((opt, idx) => {
                          const { isCorrect, isSelected } = optionStatus(idx);
                          // visual cue
                          const base = {
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 10px",
                            borderRadius: 6,
                            marginBottom: 6,
                            border: "1px solid transparent",
                            background: "#fff",
                          };

                          // priority: correct (green), selected incorrect (red), selected (blue)
                          if (isCorrect && isSelected) {
                            base.background = "#dcfce7"; // green light
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
                            <div key={idx} style={base}>
                              <div style={{ width: 28, textAlign: "center", fontWeight: 700, color: isCorrect ? "#065f46" : "#111827" }}>{String.fromCharCode(65 + idx)}</div>
                              <div style={{ flex: 1 }}>{renderOptionLabel(opt)}</div>
                              <div style={{ minWidth: 120, textAlign: "right", fontSize: 13, color: "#374151" }}>
                                {isCorrect && <span style={{ color: "#065f46", fontWeight: 600 }}>Correct</span>}
                                {!isCorrect && isSelected && <span style={{ color: "#b91c1c", fontWeight: 600 }}>Your answer</span>}
                                {!isCorrect && !isSelected && <span>&nbsp;</span>}
                              </div>
                            </div>
                          );
                        })}

                        {/* explicit legend for user's selection(s) and correct answer(s) when no options or edge cases */}
                        <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                          <div>
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

                    <div style={{ width: 120, textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: (Array.isArray(selected) ? JSON.stringify(selected) === JSON.stringify(correct) : selected === correct) ? "#065f46" : "#b91c1c", fontWeight: 700 }}>
                        {(Array.isArray(selected) ? JSON.stringify(selected) === JSON.stringify(correct) : selected === correct) ? "Correct" : "Incorrect"}
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
