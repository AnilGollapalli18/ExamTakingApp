import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { CheckCircle, XCircle, Award, Clock, RotateCcw, Home } from 'lucide-react';

const Results = () => {
  const { examResult, resetExam } = useExam();
  const navigate = useNavigate();

  useEffect(() => {
    if (!examResult) {
      navigate('/');
    }
  }, [examResult, navigate]);

  if (!examResult) {
    return null;
  }

  const handleRetakeExam = () => {
    resetExam();
    navigate('/');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getGradeBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className={`bg-white rounded-xl shadow-lg p-8 border-2 ${getGradeBg(examResult.percentage)} mb-8`}>
          <div className="text-center">
            <div className="mx-auto w-24 h-24 mb-6">
              {examResult.passed ? (
                <Award className={`w-full h-full ${getGradeColor(examResult.percentage)}`} />
              ) : (
                <XCircle className="w-full h-full text-red-500" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {examResult.passed ? 'Congratulations!' : 'Better luck next time!'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {examResult.passed 
                ? 'You have successfully passed the exam.' 
                : 'You need 60% to pass. Keep studying and try again!'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(examResult.percentage)} mb-1`}>
                  {examResult.score}/{examResult.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(examResult.percentage)} mb-1`}>
                  {examResult.percentage}%
                </div>
                <div className="text-sm text-gray-600">Percentage</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1 flex items-center justify-center">
                  <Clock className="h-6 w-6 mr-2" />
                  {formatTime(examResult.timeSpent)}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Question Review</h2>
          
          <div className="space-y-6">
            {examResult.results.map((result, index) => (
              <div 
                key={result.questionId}
                className={`border-l-4 pl-6 py-4 ${
                  result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                  </h3>
                  {result.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{result.question}</p>
                
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${
                    result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <span className="font-medium">Your answer: </span>
                    {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                  
                  {!result.isCorrect && (
                    <div className="p-2 bg-green-100 text-green-800 rounded">
                      <span className="font-medium">Correct answer: </span>
                      Available in detailed review
                    </div>
                  )}
                  
                  {result.explanation && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
                      <span className="font-medium">Explanation: </span>
                      {result.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
          >
            <Home className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={handleRetakeExam}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex-1"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Take Another Exam</span>
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1"
          >
            <Award className="h-5 w-5" />
            <span>View History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
