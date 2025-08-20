import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exam.js';
import { seedQuestions } from './utils/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas or MongoDB compass (using in-memory for demo)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedQuestions();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // For demo purposes, continue without MongoDB
    console.log('Continuing without database...');
    // process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
