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

// // CORS configuration
// const allowedOrigins = [
//   'https://betflix-one.vercel.app',
//   'http://localhost:3000',
//   'https://admin-betflix.vercel.app', // Add your admin frontend domain
//   'http://localhost:3001', // Local admin frontend
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (e.g., Postman) or from allowed origins
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly include OPTIONS
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // Allow cookies if using HttpOnly cookies
// }));

// // // Handle preflight requests explicitly
// // app.options('*', cors()); // Respond to all OPTIONS requests

// // Middleware
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
const { Server } = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const betRoutes = require('./routes/betRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const Round = require('./models/Round');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://betflix-one.vercel.app',
      'http://localhost:3000',
      'https://admin-betflix.vercel.app',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// CORS configuration
const allowedOrigins = [
  'https://betflix-one.vercel.app',
  'http://localhost:3000',
  'https://admin-betflix.vercel.app',
  'http://localhost:3001',
];

app.use(
  cors({
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
  })
);

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
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/admin', adminRoutes);

// Round Management
const ROUND_DURATION = 2 * 60 * 1000; // 2 minutes
let currentRound = null;

const startNewRound = async () => {
  const now = Date.now();
  const roundStart = Math.floor(now / ROUND_DURATION) * ROUND_DURATION;
  const period = `round-${roundStart}`;
  const expiresAt = new Date(roundStart + ROUND_DURATION);

  let round = await Round.findOne({ period });
  if (!round) {
    const serverSeed = crypto
      .createHash('sha256')
      .update(period)
      .digest('hex');
    round = new Round({
      period,
      createdAt: new Date(roundStart),
      expiresAt,
      serverSeed,
    });
    await round.save();
  }
  currentRound = round;

  // Broadcast round start
  io.emit('roundStart', {
    period: round.period,
    startTime: round.createdAt,
    expiresAt: round.expiresAt,
  });

  // Start countdown
  const countdown = setInterval(() => {
    const timeLeft = expiresAt - new Date();
    if (timeLeft <= 0) {
      clearInterval(countdown);
      endRound(round);
    } else {
      io.emit('countdown', { timeLeft: Math.floor(timeLeft / 1000) });
    }
  }, 1000);
};

const endRound = async (round) => {
  let updatedRound = await Round.findOne({ period: round.period });
  if (!updatedRound.resultNumber) {
    const combined = `${updatedRound.serverSeed}-${updatedRound.period}`;
    const hash = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex');
    const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
    const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

    updatedRound.resultNumber = resultNumber;
    updatedRound.resultColor = resultColor;
    await updatedRound.save();
  }

  // Process bets
  const bets = await Bet.find({ period: round.period });
  for (const bet of bets) {
    if (bet.result) continue; // Skip processed bets
    let won = false;
    let payout = 0;

    if (bet.type === 'color') {
      won = bet.value === updatedRound.resultColor;
      payout = won ? bet.amount * 2 : 0;
    } else if (bet.type === 'number') {
      if (bet.value == updatedRound.resultNumber) {
        won = true;
        payout = bet.amount * (bet.exactMultiplier || 10);
      } else if (bet.color === updatedRound.resultColor) {
        won = true;
        payout = bet.amount * 2;
      } else {
        payout = 0;
      }
    }

    bet.result = bet.type === 'color' ? updatedRound.resultColor : updatedRound.resultNumber.toString();
    bet.won = won;
    bet.payout = payout;
    await bet.save();

    // Update user balance
    const user = await User.findById(bet.userId);
    if (user) {
      user.balance = Math.max(user.balance + payout, 0);
      await user.save();
    }
  }

  // Broadcast result
  io.emit('roundResult', {
    period: updatedRound.period,
    result: { number: updatedRound.resultNumber, color: updatedRound.resultColor },
    bets,
  });

  // Start new round
  startNewRound();
};

// Start first round
startNewRound();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  if (currentRound) {
    socket.emit('roundStart', {
      period: currentRound.period,
      startTime: currentRound.createdAt,
      expiresAt: currentRound.expiresAt,
    });
  }
});

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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
