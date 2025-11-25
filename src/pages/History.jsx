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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px", minHeight: "100vh", backgroundColor: "#f9fafb" }} className="sm:py-12 sm:px-0">
      <header style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 640 ? "stretch" : "center", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }} className="sm:text-4xl">Exam History</h1>
          <div style={{ color: "#374151", marginTop: 8, fontSize: "14px" }} className="sm:text-base">
            {history.length} attempts saved{uid ? "" : " (sign in to view your history)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="sm:flex-nowrap sm:gap-4">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Dashboard
          </button>
          <button 
            onClick={clearHistory} 
            className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium hover:bg-red-100 transition-colors text-sm sm:text-base"
          >
            Clear History
          </button>
        </div>
      </header>

      {history.length === 0 && (
        <div style={{ padding: "20px", background: "#fff", borderRadius: 8, textAlign: "center" }} className="sm:p-10">
          <div style={{ fontSize: "16px", fontWeight: "500", color: "#374151", marginBottom: 8 }} className="sm:text-lg">
            No exam history found
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }} className="sm:text-base">
            Start an exam to see your results here.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {history.map((rec, idx) => {
          const perQuestionResults = rec.perQuestionResults || [];
          const created = new Date(rec.createdAt || rec.id?.replace(/^hist_/, "")).toLocaleString();
          return (
            <div key={rec.id ?? idx} style={{ border: "1px solid #e6e6e6", borderRadius: 8, padding: "16px", background: "#fff" }} className="sm:p-5 hover:shadow-md transition-shadow">
              <div style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 640 ? "flex-start" : "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px" }} className="sm:text-lg">
                    {rec.score} / {rec.total} — <span style={{ color: rec.percentage >= 60 ? "#065f46" : "#b91c1c", fontWeight: "700" }}>{rec.percentage}%</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }} className="sm:text-sm">
                    {rec.category || "Mixed"} • {created}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="w-full sm:w-auto">
                  <button 
                    onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} 
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded font-medium text-sm sm:text-base hover:bg-gray-50 transition-colors"
                  >
                    {expanded === rec.id ? "Hide" : "View"}
                  </button>
                </div>
              </div>

              {expanded === rec.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb", maxHeight: "600px", overflowY: "auto" }}>
                  {perQuestionResults.length === 0 && (
                    <div style={{ color: "#6b7280", fontSize: "14px" }} className="sm:text-base">
                      No per-question data available.
                    </div>
                  )}
                  {perQuestionResults.map((q, i) => {
                    const options = Array.isArray(q.options) ? q.options : [];
                    const correct = q.correctAnswer;
                    const selected = q.selectedAnswer;
                    const isMultipleCorrect = Array.isArray(correct);
                    const isMultipleSelected = Array.isArray(selected);
                    return (
                      <div key={q.id ?? i} style={{ borderTop: i === 0 ? "none" : "1px dashed #eef2f6", paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "14px" }} className="sm:text-base">
                          #{i + 1} {q.question}
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {options.map((opt, oi) => {
                            const isCorrect = isMultipleCorrect ? correct.includes(oi) : oi === correct;
                            const isSelected = isMultipleSelected ? (selected || []).includes(oi) : selected === oi;
                            const base = {
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              padding: "10px 12px",
                              borderRadius: 6,
                              background: "#fff",
                              border: "1px solid transparent",
                              fontSize: "13px"
                            };
                            if (isCorrect && isSelected) { base.background = "#dcfce7"; base.border = "1px solid #86efac"; }
                            else if (isCorrect) { base.background = "#ecfdf5"; base.border = "1px solid #86efac"; }
                            else if (isSelected && !isCorrect) { base.background = "#fee2e2"; base.border = "1px solid #fca5a5"; }
                            else if (isSelected) { base.background = "#eff6ff"; base.border = "1px solid #bfdbfe"; }
                            return (
                              <div key={oi} style={base} className="sm:text-sm">
                                <div style={{ width: 28, textAlign: "center", fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</div>
                                <div style={{ flex: 1 }}>{renderOptionLabel(opt)}</div>
                                <div style={{ minWidth: 100, textAlign: "right", fontSize: 12, color: "#374151", flexShrink: 0 }} className="sm:text-xs">
                                  {isCorrect ? <span style={{ color: "#065f46", fontWeight: 600 }}>Correct</span> : (isSelected ? <span style={{ color: "#b91c1c", fontWeight: 600 }}>Your answer</span> : <span>&nbsp;</span>)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }} className="sm:text-sm">
                          <div style={{ marginBottom: 4 }}>Your selection: <strong>{selected == null || (Array.isArray(selected) && selected.length === 0) ? "—" : (Array.isArray(selected) ? selected.map(s=>String.fromCharCode(65+s)).join(", ") : String.fromCharCode(65+selected))}</strong></div>
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
