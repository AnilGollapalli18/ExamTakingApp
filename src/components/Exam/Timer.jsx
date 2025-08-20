import React, { useEffect } from 'react';
import { useExam } from '../../contexts/ExamContext';
import { Clock } from 'lucide-react';

const Timer = ({ onTimeUp }) => {
  const { timeRemaining, setTimeRemaining, examStarted, examCompleted } = useExam();

  useEffect(() => {
    if (!examStarted || examCompleted) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, examCompleted, onTimeUp, setTimeRemaining]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-orange-600'; // Last 10 minutes
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center space-x-2 ${getTimerColor()} font-mono text-lg font-bold`}>
      <Clock className="h-5 w-5" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
};

export default Timer;
