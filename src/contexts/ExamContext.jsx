
import React, { createContext, useContext, useState } from 'react';

const ExamContext = createContext(undefined);

export const useExam = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examResult, setExamResult] = useState(null);

  const setAnswer = (questionId, optionId) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a =>
          a.questionId === questionId
            ? { ...a, selectedOptionId: optionId }
            : a
        );
      }
      return [...prev, { questionId, selectedOptionId: optionId }];
    });
  };

  const resetExam = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeRemaining(30 * 60);
    setExamStarted(false);
    setExamCompleted(false);
    setExamResult(null);
  };

  const value = {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    examStarted,
    examCompleted,
    examResult,
    setQuestions,
    setCurrentQuestionIndex,
    setAnswer,
    setTimeRemaining,
    setExamStarted,
    setExamCompleted,
    setExamResult,
    resetExam
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};
