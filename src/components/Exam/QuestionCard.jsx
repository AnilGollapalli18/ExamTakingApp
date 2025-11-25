import React from "react";
import { useExam } from "../../contexts/ExamContext";

export default function QuestionCard({ question }) {
  const { answers = {}, setAnswer } = useExam();

  // canonical question id
  const qid = question?.id ?? question?._id ?? String(Math.random());
  const opts = Array.isArray(question?.options) ? question.options : [];

  // selected stored as index (preferred). support fallback shapes:
  let selectedIndex = null;
  if (answers) {
    if (typeof answers === "object" && !Array.isArray(answers)) {
      // answers as map: { [qid]: indexOrOptionId }
      const raw = answers[qid] ?? answers[String(qid)];
      // if raw is numeric treat as index, otherwise try to map option id -> index
      if (raw === undefined || raw === null) selectedIndex = null;
      else if (Number.isInteger(raw)) selectedIndex = raw;
      else {
        const found = opts.findIndex((o, i) => String(o?.id ?? i) === String(raw));
        selectedIndex = found >= 0 ? found : null;
      }
    } else if (Array.isArray(answers)) {
      // answers as array [{ questionId, selectedOptionIndex }]
      const entry = answers.find((a) => String(a?.questionId) === String(qid));
      selectedIndex = entry ? entry.selectedOptionIndex ?? null : null;
    }
  }

  const handleSelect = (idx) => {
    // ensure setAnswer exists and we pass (questionId, selectedIndex)
    if (typeof setAnswer === "function") {
      setAnswer(qid, idx);
    } else {
      console.warn("setAnswer not available from useExam");
    }
  };

  const difficulty = (question?.difficulty || "unknown").toLowerCase();
  const getDifficultyColor = (d) =>
    d === "easy" ? "bg-green-100 text-green-800" : d === "medium" ? "bg-yellow-100 text-yellow-800" : d === "hard" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(difficulty)}`}>
            {(difficulty || "Unknown").charAt(0).toUpperCase() + (difficulty || "Unknown").slice(1)}
          </span>
          {question?.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{question.category}</span>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">{question?.question}</h2>

      <div className="space-y-3">
        {opts.map((opt, idx) => {
          const optKey = opt?.id ?? idx;
          const isSelected = selectedIndex === idx;
          return (
            <label
              key={optKey}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name={`question-${qid}`}
                value={idx}
                checked={isSelected}
                onChange={() => handleSelect(idx)}
                className="sr-only"
                aria-label={`Option ${idx + 1}`}
              />
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full mr-4 mt-1 flex-shrink-0 border-2 ${
                  isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
                }`}
                aria-hidden
              >
                {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
              </div>

              <div className="text-sm font-medium text-gray-800 select-none">
                <span className="mr-2 font-semibold">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt.text}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
