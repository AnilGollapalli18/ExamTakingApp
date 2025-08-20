
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { examAPI } from '../services/api';
import QuestionCard from '../components/Exam/QuestionCard';
import Timer from '../components/Exam/Timer';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Exam = () => {
  const {
    questions,
    currentQuestionIndex,
    answers,
    examStarted,
    setCurrentQuestionIndex,
    setExamCompleted,
    setExamResult
  } = useExam();

  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const navigate = useNavigate();

  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!examStarted || questions.length === 0) {
      navigate('/');
      return;
    }
  }, [examStarted, questions, navigate]);

  const handleSubmitExam = async (autoSubmit = false) => {
    if (!autoSubmit && answers.length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    setLoading(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      const response = await examAPI.submitExam(answers, timeSpent);

      setExamResult(response.data);
      setExamCompleted(true);
      navigate('/results');
    } catch (error) {
      console.error('Submit exam error:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setLoading(false);
      setShowSubmitModal(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmitExam(true);
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const unansweredQuestions = questions.filter(
    (q) => !answers.find((a) => a.questionId === q._id)
  ).length;

  if (!examStarted || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Online Exam</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <Timer onTimeUp={handleTimeUp} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-2 gap-2">
                {questions.map((_, index) => {
                  const isAnswered = answers.find(
                    (a) => a.questionId === questions[index]._id
                  );
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Progress</span>
                </div>
                <p className="text-sm text-orange-700">
                  Answered: {answers.length} / {questions.length}
                </p>
                {unansweredQuestions > 0 && (
                  <p className="text-sm text-orange-700">
                    Remaining: {unansweredQuestions}
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={loading}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <QuestionCard question={questions[currentQuestionIndex]} />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Previous</span>
              </button>

              <button
                onClick={goToNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit Exam?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit your exam? You have answered {answers.length} out of {questions.length} questions.
            </p>
            {unansweredQuestions > 0 && (
              <p className="text-orange-600 text-sm mb-4">
                Warning: {unansweredQuestions} questions remain unanswered.
              </p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitExam(false)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;
