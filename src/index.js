// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const betRoutes = require('./routes/betRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const { startScheduler, checkSchedulerHealth, generateRound } = require('./services/scheduler');
require('dotenv').config();

const app = express();

// Enable trust proxy
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
  'https://betflix-one.vercel.app',
  'http://localhost:3000',
  'https://admin-betflix.vercel.app',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(helmet());
app.use(express.json());

// Root path handler
app.get('/', (req, res) => {
  res.json({ message: 'Betflix Backend API is running' });
});

// Health check
app.get('/api/scheduler/health', async (req, res) => {
  try {
    const health = await checkSchedulerHealth();
    res.json(health);
  } catch (err) {
    console.error('Health check error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// HTTP endpoint for round generation (Vercel)
app.post('/api/scheduler/generate-round', async (req, res) => {
  const { period } = req.body;
  if (!/^round-\d+$/.test(period)) {
    return res.status(400).json({ error: 'Invalid period format' });
  }
  try {
    const round = await generateRound(period);
    res.json(round);
  } catch (err) {
    console.error('Generate round error:', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      body: req.body,
    });
    res.status(500).json({ error: 'Failed to generate round', details: err.message });
  }
});

// Rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.ip,
});
app.use(limiter);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    try {
      startScheduler();
    } catch (err) {
      console.error('Failed to start scheduler:', {
        message: err.message,
        stack: err.stack,
      });
    }
  })
  .catch((err) => console.error('MongoDB connection error:', {
    message: err.message,
    stack: err.stack,
  }));

// MongoDB reconnection logic
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, reconnecting...');
  mongoose.connect(process.env.MONGODB_URI);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
  });
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;
