
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  
  getCurrentUser: (token) =>
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

export const examAPI = {
  getQuestions: (count = 10) =>
    api.get(`/exam/questions?count=${count}`),
  
  submitExam: (answers, timeSpent) =>
    api.post('/exam/submit', { answers, timeSpent }),
  
  getHistory: () =>
    api.get('/exam/history'),
};

export default api;
