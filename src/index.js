// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const betRoutes = require('./routes/betRoutes');
// const transactionRoutes = require('./routes/transactionRoutes.js');
// const referralRoutes = require('./routes/referralRoutes');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({ origin: 'https://betflix-one.vercel.app' }));
// app.use(helmet());
// app.use(express.json());

// // Root path handler
// app.get('/', (req, res) => {
//   res.json({ message: 'Betflix Backend API is running' });
// });

// // Rate-limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
// });
// app.use(limiter);

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/bets', betRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/referral', referralRoutes);

// // Error handling
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('Shutting down...');
//   await mongoose.connection.close();
//   process.exit(0);
// });


// backend/index.js
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
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://betflix-one.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// Root path handler
app.get('/', (req, res) => {
  res.json({ message: 'Betflix Backend API is running' });
});

// Rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// MongoDB reconnection logic
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, reconnecting...');
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/referral', referralRoutes);

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
