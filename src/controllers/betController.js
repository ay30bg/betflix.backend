// // src/controllers/betController.js
// const Bet = require('../models/Bet');
// const User = require('../models/User');

// exports.getBetHistory = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(10);
//     res.json(bets);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
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
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// exports.placeBet = async (req, res) => {
//   try {
//     const { type, value, amount, clientSeed, color, exactMultiplier } = req.body;
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     if (amount > user.balance) {
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     if (!clientSeed || typeof clientSeed !== 'string') {
//       return res.status(400).json({ error: 'Invalid clientSeed' });
//     }

//     const period = clientSeed.slice(0, 8);
//     const existingBet = await Bet.findOne({ userId: req.user.id, period });
//     if (existingBet) {
//       return res.status(400).json({ error: `Duplicate bet with period ${period}` });
//     }

//     // Generate result (replace with provably fair system in production)
//     const resultNumber = Math.floor(Math.random() * 10);
//     const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

//     let won = false;
//     let payout = 0;

//     if (type === 'color') {
//       won = value === resultColor;
//       payout = won ? amount * 2 : -amount;
//     } else if (type === 'number') {
//       if (value == resultNumber) { // Use == for string-to-number comparison
//         won = true;
//         payout = amount * (exactMultiplier || 10);
//       } else if (color === resultColor) {
//         won = true;
//         payout = amount * 2;
//       } else {
//         payout = -amount;
//       }
//     } else {
//       return res.status(400).json({ error: 'Invalid bet type' });
//     }

//     const newBalance = Math.max(user.balance + payout, 0);
//     await User.findByIdAndUpdate(req.user.id, { balance: newBalance, updatedAt: Date.now() });

//     const bet = new Bet({
//       userId: req.user.id,
//       period,
//       type,
//       value,
//       amount,
//       result: type === 'color' ? resultColor : resultNumber.toString(),
//       won,
//       payout,
//     });
//     await bet.save();

//     res.json({ bet, balance: newBalance });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.placeBet = async (req, res) => {
  try {
    const { type, value, amount, clientSeed, color, exactMultiplier } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (!clientSeed || typeof clientSeed !== 'string') {
      return res.status(400).json({ error: 'Invalid clientSeed' });
    }

    // Determine the current round (e.g., based on time)
    const roundDuration = 60 * 1000; // 1 minute in milliseconds
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const roundEnd = roundStart + roundDuration;
    const period = `round-${roundStart}`; // Unique period for the round

    // Check for duplicate bet in the same round by the same user
    const existingBet = await Bet.findOne({ userId: req.user.id, period });
    if (existingBet) {
      return res.status(400).json({ error: `Duplicate bet in round ${period}` });
    }

    // Find or create the round
    let round = await Round.findOne({ period });
    if (!round) {
      // Generate provably fair result
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const combined = `${clientSeed}-${serverSeed}-${period}`;
      const hash = crypto.createHash('sha256').update(combined).digest('hex');
      const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
      const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

      round = new Round({
        period,
        resultNumber,
        resultColor,
        createdAt: new Date(roundStart),
        expiresAt: new Date(roundEnd),
        serverSeed,
      });
      await round.save();
    }

    // Use the round's outcome
    const { resultNumber, resultColor } = round;

    let won = false;
    let payout = 0;

    if (type === 'color') {
      won = value === resultColor;
      payout = won ? amount * 2 : -amount;
    } else if (type === 'number') {
      if (value == resultNumber) {
        won = true;
        payout = amount * (exactMultiplier || 10);
      } else if (color === resultColor) {
        won = true;
        payout = amount * 2;
      } else {
        payout = -amount;
      }
    } else {
      return res.status(400).json({ error: 'Invalid bet type' });
    }

    const newBalance = Math.max(user.balance + payout, 0);
    await User.findByIdAndUpdate(req.user.id, { balance: newBalance, updatedAt: Date.now() });

    const bet = new Bet({
      userId: req.user.id,
      period,
      type,
      value,
      amount,
      result: type === 'color' ? resultColor : resultNumber.toString(),
      won,
      payout,
    });
    await bet.save();

    res.json({ bet, balance: newBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCurrentRound = async (req, res) => {
  try {
    const roundDuration = 60 * 1000; // 1 minute
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const period = `round-${roundStart}`;
    const round = await Round.findOne({ period });
    res.json({
      period,
      expiresAt: new Date(roundStart + roundDuration),
      result: round ? { resultNumber: round.resultNumber, resultColor: round.resultColor } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
