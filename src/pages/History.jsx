import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("examHistory");
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      // show only entries for current user (if logged in). If no user, show none to avoid leaking others' data.
      const filtered = uid ? list.filter((r) => r.uid === uid) : [];
      setHistory(filtered);
    } catch (e) {
      console.warn("Failed to read examHistory", e);
      setHistory([]);
    }
  }, [uid]);

  const clearHistory = () => {
    if (!confirm("Clear your exam history?")) return;
    try {
      const raw = localStorage.getItem("examHistory");
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      if (uid) {
        // remove only current user's entries
        const remaining = list.filter((r) => r.uid !== uid);
        localStorage.setItem("examHistory", JSON.stringify(remaining));
      } else {
        // no user: do nothing (avoid clearing other users data)
        // optionally you could clear all if desired: localStorage.removeItem("examHistory");
      }
      setHistory([]);
    } catch (e) {
      console.warn("clear failed", e);
    }
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
          <h1 style={{ margin: 0 }}>Exam History</h1>
          <div style={{ color: "#374151", marginTop: 6 }}>{history.length} attempts saved{uid ? "" : " (sign in to view your history)"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 12px", borderRadius: 6 }}>Dashboard</button>
          <button onClick={clearHistory} style={{ padding: "8px 12px", borderRadius: 6, background: "#fee2e2", border: "1px solid #fecaca" }}>
            Clear My History
          </button>
        </div>
      </header>

      {history.length === 0 && (
        <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
          No exam history found for this account.
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {history.map((rec, idx) => {
          const perQuestionResults = rec.perQuestionResults || [];
          const created = new Date(rec.createdAt || rec.id?.replace(/^hist_/, "")).toLocaleString();
          return (
            <div key={rec.id ?? idx} style={{ border: "1px solid #e6e6e6", borderRadius: 8, padding: 12, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{rec.score} / {rec.total} — {rec.percentage}%</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{rec.category || "Mixed"} • {created}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}>
                    {expanded === rec.id ? "Hide" : "View"}
                  </button>
                </div>
              </div>

              {expanded === rec.id && (
                <div style={{ marginTop: 12 }}>
                  {perQuestionResults.length === 0 && <div style={{ color: "#6b7280" }}>No per-question data.</div>}
                  {perQuestionResults.map((q, i) => {
                    const options = Array.isArray(q.options) ? q.options : [];
                    const correct = q.correctAnswer;
                    const selected = q.selectedAnswer;
                    const isMultipleCorrect = Array.isArray(correct);
                    const isMultipleSelected = Array.isArray(selected);
                    return (
                      <div key={q.id ?? i} style={{ borderTop: i === 0 ? "none" : "1px dashed #eef2f6", paddingTop: i === 0 ? 0 : 10, marginTop: i === 0 ? 0 : 10 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>#{i + 1} {q.question}</div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {options.map((opt, oi) => {
                            const isCorrect = isMultipleCorrect ? correct.includes(oi) : oi === correct;
                            const isSelected = isMultipleSelected ? (selected || []).includes(oi) : selected === oi;
                            const base = {
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              padding: "8px 10px",
                              borderRadius: 6,
                              background: "#fff",
                              border: "1px solid transparent"
                            };
                            if (isCorrect && isSelected) { base.background = "#dcfce7"; base.border = "1px solid #86efac"; }
                            else if (isCorrect) { base.background = "#ecfdf5"; base.border = "1px solid #86efac"; }
                            else if (isSelected && !isCorrect) { base.background = "#fee2e2"; base.border = "1px solid #fca5a5"; }
                            else if (isSelected) { base.background = "#eff6ff"; base.border = "1px solid #bfdbfe"; }
                            return (
                              <div key={oi} style={base}>
                                <div style={{ width: 28, textAlign: "center", fontWeight: 700 }}>{String.fromCharCode(65 + oi)}</div>
                                <div style={{ flex: 1 }}>{renderOptionLabel(opt)}</div>
                                <div style={{ minWidth: 120, textAlign: "right", fontSize: 13, color: "#374151" }}>
                                  {isCorrect ? <span style={{ color: "#065f46", fontWeight: 600 }}>Correct</span> : (isSelected ? <span style={{ color: "#b91c1c", fontWeight: 600 }}>Your answer</span> : <span>&nbsp;</span>)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                          <div>Your selection: <strong>{selected == null || (Array.isArray(selected) && selected.length === 0) ? "—" : (Array.isArray(selected) ? selected.map(s=>String.fromCharCode(65+s)).join(", ") : String.fromCharCode(65+selected))}</strong></div>
                          <div>Correct answer: <strong>{correct == null ? "—" : (Array.isArray(correct) ? correct.map(c=>String.fromCharCode(65+c)).join(", ") : String.fromCharCode(65+correct))}</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
