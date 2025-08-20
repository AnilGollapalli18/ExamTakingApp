
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { examAPI } from '../services/api';
import { Play, Clock, BookOpen, Award, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const { setQuestions, setExamStarted, resetExam } = useExam();
  const navigate = useNavigate();

  const startExam = async () => {
    setLoading(true);
    setError('');
    
    try {
      resetExam();
      const response = await examAPI.getQuestions(10);
      setQuestions(response.data.questions);
      setExamStarted(true);
      navigate('/exam');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exam questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="mt-2 text-gray-600">
            Ready to test your knowledge? Start a new exam or review your progress.
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Start Exam Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Play className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Start New Exam
            </h2>
            <p className="text-gray-600 mb-6">
              Begin a new 30-minute exam with 10 randomized questions covering various topics.
            </p>
            <button
              onClick={startExam}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Start Exam</span>
                </>
              )}
            </button>
          </div>

          {/* Exam Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Exam Information
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Duration: 30 minutes
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Questions: 10 MCQs
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Auto-submit when time expires
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Passing grade: 60%
              </li>
            </ul>
          </div>

          {/* Study Tips Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Exam Tips
            </h2>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Read each question carefully before selecting an answer
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Use the navigation to review your answers
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Keep track of time - it will auto-submit at the end
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Submit early if you've finished all questions
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/history')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-lg p-6 text-left transition-colors border"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View Exam History</h3>
                  <p className="text-gray-600">Check your past performance and track progress</p>
                </div>
              </div>
            </button>

            <div className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Achievement System</h3>
                  <p className="text-gray-600">Coming soon - earn badges and track milestones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
