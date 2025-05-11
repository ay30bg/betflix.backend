// // backend/index.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const betRoutes = require('./routes/betRoutes');
// const transactionRoutes = require('./routes/transactionRoutes');
// const referralRoutes = require('./routes/referralRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({
//   origin: ['https://betflix-one.vercel.app', 'http://localhost:3000', 'https://admin-betflix.vercel.app'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));
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
//   message: { error: 'Too many requests, please try again later.' },
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

// // MongoDB reconnection logic
// mongoose.connection.on('error', (err) => {
//   console.error('MongoDB error:', err);
// });
// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected, reconnecting...');
//   mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/bets', betRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/referral', referralRoutes);
// app.use('/api/admin', adminRoutes);


// // Error handling
// app.use((err, req, res, next) => {
//   console.error('Server error:', {
//     message: err.message,
//     stack: err.stack,
//     method: req.method,
//     url: req.url,
//     body: req.body,
//   });
//   res.status(500).json({ error: 'Something went wrong!', details: err.message });
// });

// module.exports = app;

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
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://betflix-one.vercel.app',
  'http://localhost:3000',
  'https://admin-betflix.vercel.app', // Add your admin frontend domain
  'http://localhost:3001', // Local admin frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly include OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies if using HttpOnly cookies
}));

// // Handle preflight requests explicitly
// app.options('*', cors()); // Respond to all OPTIONS requests

// Middleware
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
app.use('/api/admin', adminRoutes);

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
