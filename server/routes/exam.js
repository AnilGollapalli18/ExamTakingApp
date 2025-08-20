import express from 'express';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get randomized questions for exam
router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const requestedCount = Math.min(parseInt(count), 50); // Max 50 questions

    // Get random questions
    const questions = await Question.aggregate([
      { $sample: { size: requestedCount } }
    ]);

    // Remove correct answers from response
    const questionsSanitized = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options.map(opt => ({
        _id: opt._id,
        text: opt.text
      })),
      difficulty: q.difficulty,
      category: q.category
    }));

    res.json({
      questions: questionsSanitized,
      examDuration: 30 * 60, // 30 minutes in seconds
      totalQuestions: questionsSanitized.length
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Submit exam and calculate score
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    // Get questions with correct answers
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let correctAnswers = 0;
    const results = [];

    // Calculate score
    answers.forEach(answer => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && correctOption._id.toString() === answer.selectedOptionId;
        
        if (isCorrect) {
          correctAnswers++;
        }

        results.push({
          questionId: question._id,
          question: question.question,
          selectedOptionId: answer.selectedOptionId,
          correctOptionId: correctOption._id,
          isCorrect,
          explanation: question.explanation
        });
      }
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Save result to user's history
    const examResult = {
      examId: new Date().toISOString(),
      score: correctAnswers,
      totalQuestions,
      percentage,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    };

    await User.findByIdAndUpdate(req.user._id, {
      $push: { examResults: examResult }
    });

    res.json({
      score: correctAnswers,
      totalQuestions,
      percentage,
      timeSpent,
      results,
      passed: percentage >= 60 // 60% passing grade
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// Get user's exam history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('examResults');
    
    res.json({
      examHistory: user.examResults.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      )
    });
  } catch (error) {
    console.error('Get exam history error:', error);
    res.status(500).json({ error: 'Failed to fetch exam history' });
  }
});

export default router;