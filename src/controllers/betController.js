// const Bet = require('../models/Bet');
// const User = require('../models/User');
// const Round = require('../models/Round');
// const crypto = require('crypto');

// exports.getBetHistory = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(10);
//     res.json(bets);
//   } catch (err) {
//     console.error('Error in getBetHistory:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getBetStats = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id });
//     const totalBets = bets.length;
//     const wins = bets.filter((bet) => bet.won).length;
//     const losses = totalBets - wins;
//     res.json({ totalBets, wins, losses });
//   } catch (err) {
//     console.error('Error in getBetStats:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.placeBet = async (req, res) => {
//   try {
//     const { type, value, amount, clientSeed, color, exactMultiplier } = req.body;
//     console.log('Received bet:', { userId: req.user.id, type, value, amount, clientSeed, color, exactMultiplier });

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       console.error('User not found:', req.user.id);
//       return res.status(404).json({ error: 'User not found' });
//     }
//     console.log('User balance:', user.balance);

//     if (!Number.isFinite(amount) || amount <= 0) {
//       console.error('Invalid bet amount:', amount);
//       return res.status(400).json({ error: 'Invalid bet amount' });
//     }

//     if (amount > user.balance) {
//       console.error('Insufficient balance:', { amount, balance: user.balance });
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     if (!clientSeed || typeof clientSeed !== 'string') {
//       console.error('Invalid clientSeed:', clientSeed);
//       return res.status(400).json({ error: 'Invalid clientSeed' });
//     }

//     if (!['color', 'number'].includes(type)) {
//       console.error('Invalid bet type:', type);
//       return res.status(400).json({ error: 'Invalid bet type' });
//     }

//     if (type === 'color' && !['Green', 'Red'].includes(value)) {
//       console.error('Invalid color value:', value);
//       return res.status(400).json({ error: 'Invalid color value' });
//     }

//     if (type === 'number' && !/^\d$/.test(value)) {
//       console.error('Invalid number value:', value);
//       return res.status(400).json({ error: 'Invalid number value' });
//     }

//     const roundDuration = 120 * 1000; // 2 minutes
//     const now = Date.now();
//     const roundStart = Math.floor(now / roundDuration) * roundDuration;
//     const roundEnd = roundStart + roundDuration;
//     const period = `round-${roundStart}`;
//     console.log('Round details:', { period, roundStart, roundEnd });

//     // Updated: Prevent bets in the last 10 seconds of the round
//     if (now > roundEnd - 10000) {
//       console.error('Round ending soon:', { now, roundEnd });
//       return res.status(400).json({ error: 'Round is about to end, please wait for the next round' });
//     }

//     const existingBet = await Bet.findOne({ userId: req.user.id, period });
//     if (existingBet) {
//       console.error('Duplicate bet detected:', { userId: req.user.id, period });
//       return res.status(400).json({ error: `Only one bet allowed per round (${period})` });
//     }

//     const newBalance = user.balance - amount;
//     console.log('Updating balance:', { oldBalance: user.balance, newBalance });
//     await User.findByIdAndUpdate(req.user.id, { balance: newBalance, updatedAt: new Date() });

//     const bet = new Bet({
//       userId: req.user.id,
//       period,
//       type,
//       value,
//       amount,
//       clientSeed,
//       color: type === 'number' ? color : undefined,
//       exactMultiplier: type === 'number' ? exactMultiplier : undefined,
//       createdAt: new Date(),
//     });
//     console.log('Saving bet:', bet);
//     await bet.save();

//     res.json({ bet, balance: newBalance });
//   } catch (err) {
//     console.error('Error in placeBet:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getBetResult = async (req, res) => {
//   try {
//     const { period } = req.params;
//     const userId = req.user.id;
//     console.log('Fetching bet result:', { period, userId });

//     if (!/^round-\d+$/.test(period)) {
//       console.error('Invalid period format:', period);
//       return res.status(400).json({ error: 'Invalid period format' });
//     }

//     const bet = await Bet.findOne({ userId, period });
//     if (!bet) {
//       console.error('Bet not found:', { userId, period });
//       return res.status(404).json({ error: 'Bet not found for this round' });
//     }

//     if (bet.result && bet.won !== undefined) {
//       console.log('Returning existing bet result:', bet);
//       return res.json({ bet });
//     }

//     let round = await Round.findOne({ period });
//     if (!round) {
//       console.log('Creating new round for period:', period);
//       const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
//       const combined = `${serverSeed}-${period}`;
//       const hash = crypto.createHash('sha256').update(combined).digest('hex');
//       const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
//       const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

//       round = new Round({
//         period,
//         resultNumber,
//         resultColor,
//         createdAt: new Date(parseInt(period.split('-')[1])),
//         expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
//         serverSeed,
//       });

//       const existingRound = await Round.findOneAndUpdate(
//         { period },
//         { $setOnInsert: round },
//         { upsert: true, new: true }
//       );
//       round = existingRound;
//       console.log('Round saved:', { period, resultNumber, resultColor });
//     }

//     const gracePeriod = 10000; // 10 seconds
//     if (round.expiresAt < new Date() - gracePeriod) {
//       console.error('Round expired beyond grace period:', {
//         period,
//         expiresAt: round.expiresAt,
//         currentTime: new Date(),
//         gracePeriod,
//       });
//       return res.status(400).json({ error: 'Round has expired' });
//     }
//     console.log('Round still valid or within grace period:', {
//       period,
//       expiresAt: round.expiresAt,
//       currentTime: new Date(),
//       gracePeriod,
//     });

//     const { resultNumber, resultColor } = round;

//     let won = false;
//     let payout = 0;

//     if (bet.type === 'color') {
//       won = bet.value === resultColor;
//       payout = won ? bet.amount * 2 : 0;
//     } else if (bet.type === 'number') {
//       if (bet.value == resultNumber) {
//         won = true;
//         payout = bet.amount * (bet.exactMultiplier || 10);
//       } else if (bet.color === resultColor) {
//         won = true;
//         payout = bet.amount * 2;
//       } else {
//         payout = 0;
//       }
//     }

//     console.log('Bet result calculated:', { won, payout, resultNumber, resultColor });

//     bet.result = bet.type === 'color' ? resultColor : resultNumber.toString();
//     bet.won = won;
//     bet.payout = payout;
//     await bet.save();

//     const user = await User.findById(userId);
//     if (!user) {
//       console.error('User not found during balance update:', userId);
//       return res.status(404).json({ error: 'User not found' });
//     }
//     const newBalance = Math.max(user.balance + payout, 0);
//     console.log('Updating balance:', { oldBalance: user.balance, payout, newBalance });
//     await User.findByIdAndUpdate(userId, { balance: newBalance, updatedAt: new Date() });

//     res.json({ bet, balance: newBalance });
//   } catch (err) {
//     console.error('Error in getBetResult:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getCurrentRound = async (req, res) => {
//   try {
//     const roundDuration = 120 * 1000; // 2 minutes
//     const now = Date.now();
//     const roundStart = Math.floor(now / roundDuration) * roundDuration;
//     const period = `round-${roundStart}`;
//     const expiresAt = new Date(roundStart + roundDuration).toISOString();
//     console.log('getCurrentRound:', { now, period, expiresAt });

//     const round = await Round.findOne({ period });

//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     res.set('Pragma', 'no-cache');
//     res.set('Expires', '0');
//     res.set('Surrogate-Control', 'no-store');

//     res.json({
//       period,
//       expiresAt,
//       result: round ? { resultNumber: round.resultNumber, resultColor: round.resultColor } : null,
//     });
//   } catch (err) {
//     console.error('Error in getCurrentRound:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.preGenerateRound = async (req, res) => {
//   try {
//     const { period } = req.body;
//     if (!/^round-\d+$/.test(period)) {
//       console.error('Invalid period format in preGenerateRound:', period);
//       return res.status(400).json({ error: 'Invalid period format' });
//     }

//     const existingRound = await Round.findOne({ period });
//     if (existingRound) {
//       console.log('Round already exists:', existingRound);
//       return res.json(existingRound);
//     }

//     const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
//     const combined = `${serverSeed}-${period}`;
//     const hash = crypto.createHash('sha256').update(combined).digest('hex');
//     const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
//     const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

//     const round = new Round({
//       period,
//       resultNumber,
//       resultColor,
//       createdAt: new Date(parseInt(period.split('-')[1])),
//       expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
//       serverSeed,
//     });

//     const savedRound = await Round.findOneAndUpdate(
//       { period },
//       { $setOnInsert: round },
//       { upsert: true, new: true }
//     );

//     console.log('Pre-generated round:', savedRound);
//     res.json(savedRound);
//   } catch (err) {
//     console.error('Error in preGenerateRound:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.cleanupInvalidBets = async (req, res) => {
//   try {
//     const result = await Bet.deleteMany({
//       $or: [
//         { type: { $exists: false } },
//         { value: { $exists: false } },
//         { amount: { $exists: false } },
//         { period: { $exists: false } },
//       ],
//     });
//     console.log('Cleaned up invalid bets:', result);
//     res.json(result);
//   } catch (err) {
//     console.error('Error in cleanupInvalidBets:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

const mongoose = require('mongoose');
const Redis = require('ioredis');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Round = require('../models/Round');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

const redis = new Redis(); // Initialize Redis client

// Input validation helper
const validateBetInput = ({ type, value, amount, clientSeed, color }) => {
  if (!['color', 'number'].includes(type)) return 'Invalid bet type';
  if (type === 'color' && !['Green', 'Red'].includes(value)) return 'Invalid color value';
  if (type === 'number' && !/^\d$/.test(value)) return 'Invalid number value';
  if (!Number.isFinite(amount) || amount <= 0) return 'Invalid bet amount';
  if (!clientSeed || typeof clientSeed !== 'string' || clientSeed.length > 100) return 'Invalid clientSeed';
  if (!['Green', 'Red'].includes(color)) return 'Invalid color';
  return null;
};

// Refund bets for expired rounds
const refundExpiredBets = async (round, session) => {
  const bets = await Bet.find({ period: round.period }).session(session);
  for (const bet of bets) {
    const user = await User.findById(bet.userId).session(session);
    if (!user) continue;
    user.balance += bet.amount;
    await user.save({ session });
    await new Transaction({
      userId: bet.userId,
      type: 'refund',
      amount: bet.amount,
      roundId: round._id,
      createdAt: new Date(),
    }).save({ session });
    bet.status = 'refunded';
    await bet.save({ session });
  }
};

exports.getBetHistory = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(bets);
  } catch (err) {
    console.error('Error in getBetHistory:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBetStats = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id });
    const totalBets = bets.length;
    const wins = bets.filter((bet) => bet.won).length;
    const losses = totalBets - wins;
    res.json({ totalBets, wins, losses });
  } catch (err) {
    console.error('Error in getBetStats:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.placeBet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type, value, amount, clientSeed, color } = req.body;
    console.log('Received bet:', { userId: req.user.id, type, value, amount, clientSeed, color });

    // Input validation
    const validationError = validateBetInput({ type, value, amount, clientSeed, color });
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ error: validationError });
    }

    const user = await User.findById(req.user.id).session(session);
    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    if (amount > user.balance) {
      console.error('Insufficient balance:', { amount, balance: user.balance });
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const roundDuration = 120 * 1000; // 2 minutes
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const roundEnd = roundStart + roundDuration;
    const period = `round-${roundStart}`;

    // Prevent bets in the last 10 seconds
    if (now > roundEnd - 10000) {
      console.error('Round ending soon:', { now, roundEnd });
      return res.status(400).json({ error: 'Round is about to end, please wait for the next round' });
    }

    // Check existing bets for this round
    const existingBets = await Bet.find({ userId: req.user.id, period }).session(session);
    if (existingBets.length >= 3) {
      console.error('Too many bets:', { betCount: existingBets.length });
      return res.status(400).json({ error: 'Maximum 3 bets per round' });
    }
    for (const existingBet of existingBets) {
      if (existingBet.color !== color) {
        console.error('Color mismatch:', { existingColor: existingBet.color, newColor: color });
        return res.status(400).json({ error: 'All bets in a round must be on the same color' });
      }
    }

    // Check Redis for round status
    const roundStatus = await redis.get(`round:${period}`);
    if (roundStatus === 'expired') {
      console.error('Round expired in Redis:', period);
      return res.status(400).json({ error: 'Round has expired' });
    }

    // Deduct balance
    user.balance -= amount;
    await user.save({ session });

    // Create bet
    const bet = new Bet({
      userId: req.user.id,
      period,
      type,
      value,
      amount,
      clientSeed,
      color,
      createdAt: new Date(),
      status: 'pending',
    });
    await bet.save({ session });

    // Log transaction
    await new Transaction({
      userId: req.user.id,
      type: 'bet',
      amount: -amount,
      roundId: period,
      createdAt: new Date(),
    }).save({ session });

    await session.commitTransaction();
    res.json({ bet, balance: user.balance });
  } catch (err) {
    await session.abortTransaction();
    console.error('Error in placeBet:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    session.endSession();
  }
};

exports.getBetResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { period } = req.params;
    const userId = req.user.id;
    console.log('Fetching bet result:', { period, userId });

    if (!/^round-\d+$/.test(period)) {
      console.error('Invalid period format:', period);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const bets = await Bet.find({ userId, period }).session(session);
    if (!bets.length) {
      console.error('No bets found:', { userId, period });
      return res.status(404).json({ error: 'No bets found for this round' });
    }

    // Check if results are already processed
    if (bets.every((bet) => bet.status === 'processed')) {
      console.log('Returning existing bet results:', bets);
      return res.json({ bets });
    }

    // Check Redis for round status
    let roundStatus = await redis.get(`round:${period}`);
    if (roundStatus === 'expired') {
      console.error('Round expired in Redis:', period);
      await refundExpiredBets({ period }, session);
      await session.commitTransaction();
      return res.status(400).json({ error: 'Round has expired, bets refunded' });
    }

    let round = await Round.findOne({ period }).session(session);
    if (!round) {
      const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
      const combined = `${serverSeed}-${period}`;
      const hash = crypto.createHash('sha256').update(combined).digest('hex');
      const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
      const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

      round = new Round({
        period,
        resultNumber,
        resultColor,
        createdAt: new Date(parseInt(period.split('-')[1])),
        expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
        serverSeed,
      });
      await round.save({ session });
      console.log('Round created:', { period, resultNumber, resultColor });

      // Cache round result in Redis
      await redis.set(`round:${period}`, JSON.stringify({ resultNumber, resultColor }), 'EX', 130);
    }

    // Check for round expiration
    const gracePeriod = 10000; // 10 seconds
    if (round.expiresAt < new Date() - gracePeriod) {
      console.error('Round expired:', { period, expiresAt: round.expiresAt });
      await redis.set(`round:${period}`, 'expired', 'EX', 86400);
      await refundExpiredBets(round, session);
      await session.commitTransaction();
      return res.status(400).json({ error: 'Round has expired, bets refunded' });
    }

    const { resultNumber, resultColor } = round;
    const user = await User.findById(userId).session(session);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    let totalPayout = 0;
    for (const bet of bets) {
      if (bet.status === 'processed') continue; // Skip already processed bets

      let won = false;
      let payout = 0;

      if (bet.type === 'color') {
        won = bet.value === resultColor;
        payout = won ? bet.amount * 1.9 : 0;
      } else if (bet.type === 'number') {
        won = bet.value == resultNumber;
        payout = won ? bet.amount * 6.8 : 0; // No payout for color match
      }

      bet.result = bet.type === 'color' ? resultColor : resultNumber.toString();
      bet.won = won;
      bet.payout = payout;
      bet.status = 'processed';
      await bet.save({ session });

      totalPayout += payout;

      // Log transaction
      await new Transaction({
        userId,
        type: won ? 'win' : 'loss',
        amount: won ? payout : -bet.amount,
        roundId: period,
        createdAt: new Date(),
      }).save({ session });
    }

    // Update user balance
    user.balance = Math.max(user.balance + totalPayout, 0);
    await user.save({ session });

    await session.commitTransaction();
    res.json({ bets, balance: user.balance });
  } catch (err) {
    await session.abortTransaction();
    console.error('Error in getBetResult:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    session.endSession();
  }
};

exports.getCurrentRound = async (req, res) => {
  try {
    const roundDuration = 120 * 1000; // 2 minutes
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const period = `round-${roundStart}`;
    const expiresAt = new Date(roundStart + roundDuration).toISOString();
    console.log('getCurrentRound:', { now, period, expiresAt });

    const round = await Round.findOne({ period });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.json({
      period,
      expiresAt,
      result: round ? { resultNumber: round.resultNumber, resultColor: round.resultColor } : null,
    });
  } catch (err) {
    console.error('Error in getCurrentRound:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.preGenerateRound = async (req, res) => {
  try {
    const { period } = req.body;
    if (!/^round-\d+$/.test(period)) {
      console.error('Invalid period format in preGenerateRound:', period);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const existingRound = await Round.findOne({ period });
    if (existingRound) {
      console.log('Round already exists:', existingRound);
      return res.json(existingRound);
    }

    const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
    const combined = `${serverSeed}-${period}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
    const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

    const round = new Round({
      period,
      resultNumber,
      resultColor,
      createdAt: new Date(parseInt(period.split('-')[1])),
      expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
      serverSeed,
    });

    const savedRound = await Round.findOneAndUpdate(
      { period },
      { $setOnInsert: round },
      { upsert: true, new: true }
    );

    console.log('Pre-generated round:', savedRound);
    res.json(savedRound);
  } catch (err) {
    console.error('Error in preGenerateRound:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.cleanupInvalidBets = async (req, res) => {
  try {
    const result = await Bet.deleteMany({
      $or: [
        { type: { $exists: false } },
        { value: { $exists: false } },
        { amount: { $exists: false } },
        { period: { $exists: false } },
        { userId: { $exists: false } },
        { status: { $exists: false } },
      ],
    });
    console.log('Cleaned up invalid bets:', result);
    res.json(result);
  } catch (err) {
    console.error('Error in cleanupInvalidBets:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.withdrawHouseEarnings = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const earnings = await Transaction.aggregate([
      { $match: { type: 'loss' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalEarnings = earnings.length ? Math.abs(earnings[0].total) : 0;
    // Implement crypto withdrawal logic here (e.g., to a designated wallet)
    console.log('Initiating withdrawal:', { totalEarnings });

    res.json({ message: 'Withdrawal initiated', totalEarnings });
  } catch (err) {
    console.error('Error in withdrawHouseEarnings:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
