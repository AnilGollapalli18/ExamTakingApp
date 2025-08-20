import React from 'react';
import { useExam } from '../../contexts/ExamContext';

const QuestionCard = ({ question }) => {
  const { answers, setAnswer } = useExam();
  
  const selectedAnswer = answers.find(a => a.questionId === question._id);

  const handleOptionSelect = (optionId) => {
    setAnswer(question._id, optionId);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="flex space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {question.category}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-4">
        {question.options.map((option, index) => (
          <label
            key={option._id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
              selectedAnswer?.selectedOptionId === option._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <input
              type="radio"
              name={`question-${question._id}`}
              value={option._id}
              checked={selectedAnswer?.selectedOptionId === option._id}
              onChange={() => handleOptionSelect(option._id)}
              className="sr-only"
            />
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-4 flex-shrink-0 ${
                selectedAnswer?.selectedOptionId === option._id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {selectedAnswer?.selectedOptionId === option._id && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <span className="text-base font-medium text-gray-700 select-none">
              {String.fromCharCode(65 + index)}. {option.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
