require("dotenv").config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const proxy = require('express-http-proxy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

const authProxy = proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/auth/, '') || '/'
});

const notesProxy = proxy(process.env.NOTES_SERVICE_URL, {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/notes/, '') || '/'
});

const flashcardsProxy = proxy(process.env.FLASHCARD_SERVICE_URL, {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/flashcards/, '') || '/'
});

const quizProxy = proxy(process.env.QUIZ_SERVICE_URL, {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/quizzes/, '') || '/'
});

const statsProxy = proxy(process.env.STATS_SERVICE_URL, {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/stats/, '/stats') || '/stats'
});

app.use('/api/auth', authProxy);
app.use('/api/notes', notesProxy);
app.use('/api/flashcards', flashcardsProxy);
app.use('/api/quizzes', quizProxy);
app.use('/api/stats', statsProxy);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});