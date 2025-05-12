// const Bet = require('../models/Bet');
// const User = require('../models/User');
// const Round = require('../models/Round');
// const crypto = require('crypto');
// const rateLimit = require('express-rate-limit');

// // Rate limiter for getCurrentRound
// const currentRoundLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 10, // 10 requests per minute per user
//   keyGenerator: (req) => req.user?.id || req.ip, // Use user ID if authenticated, else IP
//   message: 'Too many requests to get current round, please try again later',
// });

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

//     const roundDuration = 60 * 1000;
//     const now = Date.now();
//     const roundStart = Math.floor(now / roundDuration) * roundDuration;
//     const roundEnd = roundStart + roundDuration;
//     const period = `round-${roundStart}`;
//     console.log('Round details:', { period, roundStart, roundEnd });

//     if (now > roundEnd - 5000) {
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
//     await User.findByIdAndUpdate(req.user.id, { balance: newBalance, updatedAt: Date.now() });

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
//         expiresAt: new Date(parseInt(period.split('-')[1]) + 60 * 1000),
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

//     if (round.expiresAt < new Date()) {
//       console.error('Round expired:', { period, expiresAt: round.expiresAt });
//       return res.status(400).json({ error: 'Round has expired' });
//     }

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
//     await User.findByIdAndUpdate(userId, { balance: newBalance, updatedAt: Date.now() });

//     res.json({ bet, balance: newBalance });
//   } catch (err) {
//     console.error('Error in getBetResult:', err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getCurrentRound = [
//   currentRoundLimiter,
//   async (req, res) => {
//     try {
//       const roundDuration = 60 * 1000;
//       const now = Date.now();
//       const roundStart = Math.floor(now / roundDuration) * roundDuration;
//       const period = `round-${roundStart}`;
//       const expiresAt = new Date(roundStart + roundDuration).toISOString();
//       console.log('getCurrentRound:', { now, period, expiresAt });

//       const round = await Round.findOne({ period });

//       res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//       res.set('Pragma', 'no-cache');
//       res.set('Expires', '0');
//       res.set('Surrogate-Control', 'no-store');

//       res.json({
//         period,
//         expiresAt,
//         result: round ? { resultNumber: round.resultNumber, resultColor: round.resultColor } : null,
//       });
//     } catch (err) {
//       console.error('Error in getCurrentRound:', err.message, err.stack);
//       res.status(500).json({ error: 'Server error', details: err.message });
//     }
//   },
// ];

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
//       expiresAt: new Date(parseInt(period.split('-')[1]) + 60 * 1000),
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


const Bet = require('../models/Bet');
const User = require('../models/User');
const Round = require('../models/Round');
const crypto = require('crypto');

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
  try {
    const { type, value, amount, clientSeed, color, exactMultiplier } = req.body;
    console.log('Received bet:', { userId: req.user.id, type, value, amount, clientSeed, color, exactMultiplier });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User balance:', user.balance);

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error('Invalid bet amount:', amount);
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    if (amount > user.balance) {
      console.error('Insufficient balance:', { amount, balance: user.balance });
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (!clientSeed || typeof clientSeed !== 'string') {
      console.error('Invalid clientSeed:', clientSeed);
      return res.status(400).json({ error: 'Invalid clientSeed' });
    }

    if (!['color', 'number'].includes(type)) {
      console.error('Invalid bet type:', type);
      return res.status(400).json({ error: 'Invalid bet type' });
    }

    if (type === 'color' && !['Green', 'Red'].includes(value)) {
      console.error('Invalid color value:', value);
      return res.status(400).json({ error: 'Invalid color value' });
    }

    if (type === 'number' && !/^\d$/.test(value)) {
      console.error('Invalid number value:', value);
      return res.status(400).json({ error: 'Invalid number value' });
    }

    const roundDuration = 60 * 1000;
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const roundEnd = roundStart + roundDuration;
    const period = `round-${roundStart}`;
    console.log('Round details:', { period, roundStart, roundEnd });

    if (now > roundEnd - 5000) {
      console.error('Round ending soon:', { now, roundEnd });
      return res.status(400).json({ error: 'Round is about to end, please wait for the next round' });
    }

    const existingBet = await Bet.findOne({ userId: req.user.id, period });
    if (existingBet) {
      console.error('Duplicate bet detected:', { userId: req.user.id, period });
      return res.status(400).json({ error: `Only one bet allowed per round (${period})` });
    }

    const newBalance = user.balance - amount;
    console.log('Updating balance:', { oldBalance: user.balance, newBalance });
    await User.findByIdAndUpdate(req.user.id, { balance: newBalance, updatedAt: Date.now() });

    const bet = new Bet({
      userId: req.user.id,
      period,
      type,
      value,
      amount,
      clientSeed,
      color: type === 'number' ? color : undefined,
      exactMultiplier: type === 'number' ? exactMultiplier : undefined,
      createdAt: new Date(),
    });
    console.log('Saving bet:', bet);
    await bet.save();

    res.json({ bet, balance: newBalance });
  } catch (err) {
    console.error('Error in placeBet:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBetResult = async (req, res) => {
  try {
    const { period } = req.params;
    const userId = req.user.id;
    console.log('Fetching bet result:', { period, userId });

    if (!/^round-\d+$/.test(period)) {
      console.error('Invalid period format:', period);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const bet = await Bet.find Ставка.findOne({ userId, period });
    if (!bet) {
      console.error('Bet not found:', { userId, period });
      return res.status(404).json({ error: 'Bet not found for this round' });
    }

    if (bet.result && bet.won !== undefined) {
      console.log('Returning existing bet result:', bet);
      return res.json({ bet });
    }

    let round = await Round.findOne({ period });
    if (!round) {
      console.log('Creating new round for period:', period);
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
        expiresAt: new Date(parseInt(period.split('-')[1]) + 60 * 1000),
        serverSeed,
      });

      const existingRound = await Round.findOneAndUpdate(
        { period },
        { $setOnInsert: round },
        { upsert: true, new: true }
      );
      round = existingRound;
      console.log('Round saved:', { period, resultNumber, resultColor });
    }

    if (round.expiresAt < new Date()) {
      console.error('Round expired:', { period, expiresAt: round.expiresAt });
      return res.status(400).json({ error: 'Round has expired' });
    }

    const { resultNumber, resultColor } = round;

    let won = false;
    let payout = 0;

    if (bet.type === 'color') {
      won = bet.value === resultColor;
      payout = won ? bet.amount * 2 : 0;
    } else if (bet.type === 'number') {
      if (bet.value == resultNumber) {
        won = true;
        payout = bet.amount * (bet.exactMultiplier || 10);
      } else if (bet.color === resultColor) {
        won = true;
        payout = bet.amount * 2;
      } else {
        payout = 0;
      }
    }

    console.log('Bet result calculated:', { won, payout, resultNumber, resultColor });

    bet.result = bet.type === 'color' ? resultColor : resultNumber.toString();
    bet.won = won;
    bet.payout = payout;
    await bet.save();

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found during balance update:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    const newBalance = Math.max(user.balance + payout, 0);
    console.log('Updating balance:', { oldBalance: user.balance, payout, newBalance });
    await User.findByIdAndUpdate(userId, { balance: newBalance, updatedAt: Date.now() });

    res.json({ bet, balance: newBalance });
  } catch (err) {
    console.error('Error in getBetResult:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getCurrentRound = async (req, res) => {
  try {
    const roundDuration = 60 * 1000;
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
      expiresAt: new Date(parseInt(period.split('-')[1]) + 60 * 1000),
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
      ],
    });
    console.log('Cleaned up invalid bets:', result);
    res.json(result);
  } catch (err) {
    console.error('Error in cleanupInvalidBets:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
