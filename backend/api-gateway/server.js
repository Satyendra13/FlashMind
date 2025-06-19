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
  origin: 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

const authProxy = proxy('http://localhost:3001', {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/auth/, '') || '/'
});

const notesProxy = proxy('http://localhost:3002', {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/notes/, '') || '/'
});

const flashcardsProxy = proxy('http://localhost:3003', {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/flashcards/, '') || '/'
});

const quizProxy = proxy('http://localhost:3004', {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/quizzes/, '') || '/'
});

const dashboardProxy = proxy('http://localhost:3001', {
  proxyReqPathResolver: req => req.originalUrl.replace(/^\/api\/dashboard/, '/dashboard') || '/dashboard'
});

app.use('/api/auth', authProxy);
app.use('/api/notes', notesProxy);
app.use('/api/flashcards', flashcardsProxy);
app.use('/api/quizzes', quizProxy);
app.use('/api/dashboard', dashboardProxy);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});