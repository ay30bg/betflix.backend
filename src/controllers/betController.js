// const Bet = require('../models/Bet');
// const User = require('../models/User');
// const Round = require('../models/Round');
// const crypto = require('crypto');
// const { createRound } = require('../utils/roundUtils');

// const PAYOUT_MULTIPLIERS = {
//   color: 1.9,
//   number: 6.8,
// };

// exports.getBetHistory = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(10);
//     res.json(bets);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getBetHistory:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getBetStats = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id });
    
//     // Separate finalized and pending bets
//     const finalizedBets = bets.filter((bet) => bet.won !== undefined);
//     const pendingBets = bets.filter((bet) => bet.won === undefined);

//     const totalBets = finalizedBets.length;
//     const wins = finalizedBets.filter((bet) => bet.won).length;
//     const losses = totalBets - wins;
//     const pendingBetsCount = pendingBets.length;

//     res.json({ totalBets, wins, losses, pendingBets: pendingBetsCount });
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getBetStats:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.placeBet = async (req, res) => {
//   try {
//     const { type, value, amount, clientSeed } = req.body;
//     console.log(`[${new Date().toISOString()}] Received bet:`, { userId: req.user.id, type, value, amount, clientSeed });

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       console.error(`[${new Date().toISOString()}] User not found: ${req.user.id}`);
//       return res.status(404).json({ error: 'User not found' });
//     }

//     if (!Number.isFinite(amount) || amount <= 0) {
//       console.error(`[${new Date().toISOString()}] Invalid bet amount: ${amount}`);
//       return res.status(400).json({ error: 'Invalid bet amount' });
//     }

//     if (amount > user.balance) {
//       console.error(`[${new Date().toISOString()}] Insufficient balance: ${amount} > ${user.balance}`);
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     if (!clientSeed || typeof clientSeed !== 'string') {
//       console.error(`[${new Date().toISOString()}] Invalid clientSeed: ${clientSeed}`);
//       return res.status(400).json({ error: 'Invalid clientSeed' });
//     }

//     if (!['color', 'number'].includes(type)) {
//       console.error(`[${new Date().toISOString()}] Invalid bet type: ${type}`);
//       return res.status(400).json({ error: 'Invalid bet type' });
//     }

//     if (type === 'color' && !['Green', 'Red'].includes(value)) {
//       console.error(`[${new Date().toISOString()}] Invalid color value: ${value}`);
//       return res.status(400).json({ error: 'Invalid color value' });
//     }

//     if (type === 'number' && !/^\d$/.test(value)) {
//       console.error(`[${new Date().toISOString()}] Invalid number value: ${value}`);
//       return res.status(400).json({ error: 'Invalid number value' });
//     }

//     const roundDuration = 120 * 1000;
//     const now = Date.now();
//     const roundStart = Math.floor(now / roundDuration) * roundDuration;
//     const roundEnd = roundStart + roundDuration;
//     const period = `round-${roundStart}`;
//     console.log(`[${new Date().toISOString()}] Round details:`, { period, roundStart, roundEnd });

//     if (now > roundEnd - 10000) {
//       console.error(`[${new Date().toISOString()}] Round ending soon: now=${now}, roundEnd=${roundEnd}`);
//       return res.status(400).json({ error: 'Round is about to end, please wait for the next round' });
//     }

//     await createRound(period); // Use pre-generated or create

//     const existingBet = await Bet.findOne({ userId: req.user.id, period });
//     if (existingBet) {
//       console.error(`[${new Date().toISOString()}] Duplicate bet detected: userId=${req.user.id}, period=${period}`);
//       return res.status(400).json({ error: `Only one bet allowed per round (${period})` });
//     }

//     const session = await Bet.startSession();
//     session.startTransaction();
//     try {
//       const newBalance = user.balance - amount;
//       await User.findByIdAndUpdate(
//         req.user.id,
//         { balance: newBalance, updatedAt: new Date() },
//         { session }
//       );

//       const bet = new Bet({
//         userId: req.user.id,
//         period,
//         type,
//         value,
//         amount,
//         clientSeed,
//         createdAt: new Date(),
//       });
//       await bet.save({ session });

//       await session.commitTransaction();
//       res.json({ bet, balance: newBalance });
//     } catch (err) {
//       await session.abortTransaction();
//       throw err;
//     } finally {
//       session.endSession();
//     }
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in placeBet:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getBetResult = async (req, res) => {
//   try {
//     const { period } = req.params;
//     const userId = req.user.id;
//     const roundDuration = 120 * 1000;
//     console.log(`[${new Date().toISOString()}] Fetching bet result:`, { period });

//     const periodMatch = period.match(/^round-(\d+)$/);
//     if (!periodMatch) {
//       console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
//       return res.status(400).json({ error: 'Invalid period format. Expected round-<timestamp>' });
//     }

//     const timestamp = parseInt(periodMatch[1]);
//     if (timestamp % roundDuration !== 0) {
//       console.error(`[${new Date().toISOString()}] Invalid period timestamp: not aligned with round duration: ${period}`);
//       return res.status(400).json({
//         error: 'Invalid period timestamp. Must be aligned with 2-minute round duration',
//       });
//     }

//     const bet = await Bet.findOne({ userId, period });
//     if (!bet) {
//       console.error(`[${new Date().toISOString()}] Bet not found:`, { userId, period });
//       return res.status(404).json({ error: 'Bet not found for this round' });
//     }

//     const validBetTypes = ['color', 'number'];
//     const validColors = ['Green', 'Red'];
//     if (!validBetTypes.includes(bet.type)) {
//       return res.status(400).json({ error: 'Invalid bet type' });
//     }
//     if (bet.type === 'color' && !validColors.includes(bet.value)) {
//       return res.status(400).json({ error: 'Invalid color value' });
//     }
//     if (bet.type === 'number' && !/^\d$/.test(bet.value)) {
//       return res.status(400).json({ error: 'Invalid number value' });
//     }

//     if (bet.result && bet.won !== undefined) {
//       console.log(`[${new Date().toISOString()}] Returning existing bet result:`, bet);
//       return res.json({ bet });
//     }

//     let round = await Round.findOne({ period });
//     if (!round) {
//       round = await createRound(period);
//       console.log(`[${new Date().toISOString()}] Round created:`, { period, resultNumber: round.resultNumber, resultColor: round.resultColor });
//     } else {
//       console.log(`[${new Date().toISOString()}] Using existing round:`, {
//         period,
//         resultNumber: round.resultNumber,
//         resultColor: round.resultColor,
//         isManuallySet: round.isManuallySet,
//       });
//     }

//     const gracePeriod = 10000;
//     if (round.expiresAt < new Date(Date.now() - gracePeriod)) {
//       console.error(`[${new Date().toISOString()}] Round expired beyond grace period:`, {
//         period,
//         expiresAt: round.expiresAt,
//         currentTime: new Date(),
//         gracePeriod,
//       });
//       return res.status(400).json({ error: 'Round has expired' });
//     }

//     const { resultNumber, resultColor } = round;

//     let won = false;
//     let payout = 0;

//     if (bet.type === 'color') {
//       wonfurt = bet.value === resultColor;
//       payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
//     } else if (bet.type === 'number') {
//       if (parseInt(bet.value) === resultNumber) {
//         won = true;
//         payout = bet.amount * PAYOUT_MULTIPLIERS.number;
//       }
//     }

//     console.log(`[${new Date().toISOString()}] Bet result calculated:`, {
//       won,
//       payout,
//       resultNumber,
//       resultColor,
//       isManuallySet: round.isManuallySet,
//     });

//     const session = await Bet.startSession();
//     session.startTransaction();
//     try {
//       bet.result = bet.type === 'color' ? resultColor : resultNumber.toString();
//       bet.won = won;
//       bet.payout = payout;
//       await bet.save({ session });

//       const user = await User.findById(userId).session(session);
//       if (!user) {
//         throw new Error('User not found');
//       }

//       const newBalance = Math.max(user.balance + payout, 0);
//       await User.findByIdAndUpdate(
//         userId,
//         { $set: { balance: newBalance, updatedAt: new Date() } },
//         { session }
//       );

//       await session.commitTransaction();
//       res.json({ bet, balance: newBalance });
//     } catch (err) {
//       await session.abortTransaction();
//       throw err;
//     } finally {
//       session.endSession();
//     }
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getBetResult:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// exports.getCurrentRound = async (req, res) => {
//   try {
//     const roundDuration = 120 * 1000;
//     const now = Date.now();
//     const roundStart = Math.floor(now / roundDuration) * roundDuration;
//     const period = `round-${roundStart}`;
//     const expiresAt = new Date(roundStart + roundDuration).toISOString();
//     console.log(`[${new Date().toISOString()}] getCurrentRound:`, { now, period, expiresAt });

//     const round = await createRound(period);

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
//     console.error(`[${new Date().toISOString()}] Error in getCurrentRound:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.preGenerateRound = async (req, res) => {
//   try {
//     const { period } = req.body;
//     console.log(`[${new Date().toISOString()}] preGenerateRound called with:`, { period, user: req.user?.id });

//     if (!/^round-\d+$/.test(period)) {
//       console.error(`[${new Date().toISOString()}] Invalid period format in preGenerateRound: ${period}`);
//       return res.status(400).json({ error: 'Invalid period format' });
//     }

//     const round = await createRound(period);
//     console.log(`[${new Date().toISOString()}] Round saved to DB:`, round);

//     res.json(round);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in preGenerateRound:`, {
//       message: err.message,
//       stack: err.stack,
//       code: err.code,
//       name: err.name,
//     });
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.triggerPreGenerateRounds = async (req, res) => {
//   try {
//     const { preGenerateRoundsFor24Hours } = require('../services/scheduler');
//     const result = await preGenerateRoundsFor24Hours();
//     console.log(`[${new Date().toISOString()}] Manual pre-generation triggered:`, result);
//     res.json(result);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in triggerPreGenerateRounds:`, err.message, err.stack);
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
//     console.log(`[${new Date().toISOString()}] Cleaned up invalid bets:`, result);
//     res.json(result);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in cleanupInvalidBets:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.setRoundOutcome = async (req, res) => {
//   try {
//     const { period } = req.params;
//     const { resultNumber, resultColor } = req.body;

//     if (!/^round-\d+$/.test(period)) {
//       console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
//       return res.status(400).json({ error: 'Invalid period format' });
//     }

//     const round = await Round.findOne({ period });
//     if (!round) {
//       console.error(`[${new Date().toISOString()}] Round not found: ${period}`);
//       return res.status(404).json({ error: 'Round not found' });
//     }

//     round.resultNumber = resultNumber;
//     round.resultColor = resultColor;
//     round.updatedAt = new Date();
//     round.isManuallySet = true;

//     await round.save();
//     console.log(`[${new Date().toISOString()}] Round outcome updated:`, { period, resultNumber, resultColor });
//     res.json(round);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in setRoundOutcome:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getRoundResult = async (req, res) => {
//   try {
//     const { period } = req.params;
//     console.log(`[${new Date().toISOString()}] Fetching round result:`, { period, adminId: req.admin?.id });

//     if (!/^round-\d+$/.test(period)) {
//       console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
//       return res.status(400).json({ error: 'Invalid period format' });
//     }

//     const round = await Round.findOne({ period });
//     if (!round) {
//       console.error(`[${new Date().toISOString()}] Round not found: ${period}`);
//       return res.status(404).json({ error: 'Round not found' });
//     }

//     res.json({
//       period: round.period,
//       result: {
//         number: round.resultNumber.toString(),
//         color: round.resultColor,
//       },
//       createdAt: round.createdAt,
//       expiresAt: round.expiresAt,
//     });
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getRoundResult:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getAllRounds = async (req, res) => {
//   try {
//     const rounds = await Round.find()
//       .sort({ createdAt: -1 })
//       .limit(100)
//       .select('period resultNumber resultColor');

//     const formattedRounds = rounds.map((round) => ({
//       period: round.period,
//       result: {
//         color: round.resultColor || 'N/A',
//         number: round.resultNumber !== undefined ? round.resultNumber.toString() : 'N/A',
//       },
//     }));

//     console.log(`[${new Date().toISOString()}] Fetched all rounds:`, { count: formattedRounds.length });
//     res.json(formattedRounds);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getAllRounds:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getSchedulerHealth = async (req, res) => {
//   try {
//     const { checkSchedulerHealth } = require('../services/scheduler');
//     const health = await checkSchedulerHealth();
//     res.json(health);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getSchedulerHealth:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

const Bet = require('../models/Bet');
const User = require('../models/User');
const Round = require('../models/Round');
const crypto = require('crypto');
const { createRound } = require('../utils/roundUtils');
const cron = require('node-cron');

const PAYOUT_MULTIPLIERS = {
  color: 1.9,
  number: 6.8,
};

// Clean up invalid bets hourly
cron.schedule('0 * * * *', async () => {
  try {
    const result = await Bet.deleteMany({
      $or: [
        { type: { $exists: false } },
        { value: { $exists: false } },
        { amount: { $exists: false } },
        { period: { $exists: false } },
        { userId: { $exists: false } },
      ],
    });
    console.log(`[${new Date().toISOString()}] Cleaned up invalid bets:`, result);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error cleaning up invalid bets:`, err.message);
  }
});

exports.getBetHistory = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const betsWithStatus = await Promise.all(
      bets.map(async (bet) => {
        const round = await Round.findOne({ period: bet.period });
        const isPending = !round || round.expiresAt > new Date();
        console.log(`[${new Date().toISOString()}] Bet status for ${bet.period}:`, {
          isPending,
          roundExpiresAt: round ? round.expiresAt : null,
          betWon: bet.won,
          betResult: bet.result,
        });
        return {
          ...bet.toObject(),
          status: isPending ? 'pending' : 'finalized',
          roundExpiresAt: round ? round.expiresAt.toISOString() : null,
        };
      })
    );

    res.json(betsWithStatus);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getBetHistory:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBetResult = async (req, res) => {
  try {
    const { period } = req.params;
    const userId = req.user.id;
    const roundDuration = 120 * 1000;
    console.log(`[${new Date().toISOString()}] Fetching bet result:`, { period, userId });

    const periodMatch = period.match(/^round-(\d+)$/);
    if (!periodMatch) {
      console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
      return res.status(400).json({ error: 'Invalid period format. Expected round-<timestamp>' });
    }

    const timestamp = parseInt(periodMatch[1]);
    if (timestamp % roundDuration !== 0) {
      console.error(`[${new Date().toISOString()}] Invalid period timestamp: not aligned with round duration: ${period}`);
      return res.status(400).json({
        error: 'Invalid period timestamp. Must be aligned with 2-minute round duration',
      });
    }

    const bet = await Bet.findOne({ userId, period });
    if (!bet) {
      console.error(`[${new Date().toISOString()}] Bet not found:`, { userId, period });
      return res.status(404).json({ error: 'Bet not found for this round' });
    }

    const validBetTypes = ['color', 'number'];
    const validColors = ['Green', 'Red'];
    if (!validBetTypes.includes(bet.type)) {
      console.error(`[${new Date().toISOString()}] Invalid bet type: ${bet.type}`);
      return res.status(400).json({ error: 'Invalid bet type' });
    }
    if (bet.type === 'color' && !validColors.includes(bet.value)) {
      console.error(`[${new Date().toISOString()}] Invalid color value: ${bet.value}`);
      return res.status(400).json({ error: 'Invalid color value' });
    }
    if (bet.type === 'number' && !/^\d$/.test(bet.value)) {
      console.error(`[${new Date().toISOString()}] Invalid number value: ${bet.value}`);
      return res.status(400).json({ error: 'Invalid number value' });
    }

    if (bet.result && bet.won !== undefined) {
      console.log(`[${new Date().toISOString()}] Returning existing bet result:`, {
        period,
        won: bet.won,
        result: bet.result,
        payout: bet.payout,
      });
      return res.json({ bet });
    }

    let round = await Round.findOne({ period });
    if (!round) {
      round = await createRound(period);
      console.log(`[${new Date().toISOString()}] Round created:`, {
        period,
        resultNumber: round.resultNumber,
        resultColor: round.resultColor,
        expiresAt: round.expiresAt,
      });
    } else {
      console.log(`[${new Date().toISOString()}] Using existing round:`, {
        period,
        resultNumber: round.resultNumber,
        resultColor: round.resultColor,
        expiresAt: round.expiresAt,
        isManuallySet: round.isManuallySet,
      });
    }

    const now = new Date();
    const gracePeriod = 20000; // Increased to 20s to account for delays
    if (round.expiresAt > now) {
      console.log(`[${new Date().toISOString()}] Round still active:`, {
        period,
        expiresAt: round.expiresAt,
        timeLeft: (round.expiresAt - now) / 1000,
      });
      return res.status(400).json({ error: 'Round is still active', bet });
    }
    if (round.expiresAt < new Date(now - gracePeriod)) {
      console.error(`[${new Date().toISOString()}] Round expired beyond grace period:`, {
        period,
        expiresAt: round.expiresAt,
        currentTime: now,
        gracePeriod,
      });
      return res.status(400).json({ error: 'Round has expired beyond grace period' });
    }

    const { resultNumber, resultColor } = round;

    let won = false;
    let payout = 0;

    if (bet.type === 'color') {
      won = bet.value === resultColor;
      payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
    } else if (bet.type === 'number') {
      if (parseInt(bet.value) === resultNumber) {
        won = true;
        payout = bet.amount * PAYOUT_MULTIPLIERS.number;
      }
    }

    console.log(`[${new Date().toISOString()}] Bet result calculated:`, {
      period,
      won,
      payout,
      resultNumber,
      resultColor,
      isManuallySet: round.isManuallySet,
    });

    const session = await Bet.startSession();
    session.startTransaction();
    try {
      bet.result = bet.type === 'color' ? resultColor : resultNumber.toString();
      bet.won = won;
      bet.payout = payout;
      await bet.save({ session });

      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const newBalance = Math.max(user.balance + payout, 0);
      await User.findByIdAndUpdate(
        userId,
        { $set: { balance: newBalance, updatedAt: new Date() } },
        { session }
      );

      await session.commitTransaction();
      console.log(`[${new Date().toISOString()}] Bet updated successfully:`, {
        period,
        won,
        result: bet.result,
        payout,
        newBalance,
      });
      res.json({ bet, balance: newBalance });
    } catch (err) {
      await session.abortTransaction();
      console.error(`[${new Date().toISOString()}] Transaction failed in getBetResult:`, err.message, err.stack);
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getBetResult:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Other endpoints unchanged (included for completeness)
exports.getBetStats = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id });
    const finalizedBets = bets.filter((bet) => bet.won !== undefined);
    const pendingBets = bets.filter((bet) => bet.won === undefined);
    const totalBets = finalizedBets.length;
    const wins = finalizedBets.filter((bet) => bet.won).length;
    const losses = totalBets - wins;
    const pendingBetsCount = pendingBets.length;
    res.json({ totalBets, wins, losses, pendingBets: pendingBetsCount });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getBetStats:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.placeBet = async (req, res) => {
  try {
    const { type, value, amount, clientSeed } = req.body;
    console.log(`[${new Date().toISOString()}] Received bet:`, { userId: req.user.id, type, value, amount, clientSeed });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`[${new Date().toISOString()}] User not found: ${req.user.id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error(`[${new Date().toISOString()}] Invalid bet amount: ${amount}`);
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    if (amount > user.balance) {
      console.error(`[${new Date().toISOString()}] Insufficient balance: ${amount} > ${user.balance}`);
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (!clientSeed || typeof clientSeed !== 'string') {
      console.error(`[${new Date().toISOString()}] Invalid clientSeed: ${clientSeed}`);
      return res.status(400).json({ error: 'Invalid clientSeed' });
    }

    if (!['color', 'number'].includes(type)) {
      console.error(`[${new Date().toISOString()}] Invalid bet type: ${type}`);
      return res.status(400).json({ error: 'Invalid bet type' });
    }

    if (type === 'color' && !['Green', 'Red'].includes(value)) {
      console.error(`[${new Date().toISOString()}] Invalid color value: ${value}`);
      return res.status(400).json({ error: 'Invalid color value' });
    }

    if (type === 'number' && !/^\d$/.test(value)) {
      console.error(`[${new Date().toISOString()}] Invalid number value: ${value}`);
      return res.status(400).json({ error: 'Invalid number value' });
    }

    const roundDuration = 120 * 1000;
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const roundEnd = roundStart + roundDuration;
    const period = `round-${roundStart}`;
    console.log(`[${new Date().toISOString()}] Round details:`, { period, roundStart, roundEnd });

    if (now > roundEnd - 10000) {
      console.error(`[${new Date().toISOString()}] Round ending soon: now=${now}, roundEnd=${roundEnd}`);
      return res.status(400).json({ error: 'Round is about to end, please wait for the next round' });
    }

    await createRound(period);

    const existingBet = await Bet.findOne({ userId: req.user.id, period });
    if (existingBet) {
      console.error(`[${new Date().toISOString()}] Duplicate bet detected: userId=${req.user.id}, period=${period}`);
      return res.status(400).json({ error: `Only one bet allowed per round (${period})` });
    }

    const session = await Bet.startSession();
    session.startTransaction();
    try {
      const newBalance = user.balance - amount;
      await User.findByIdAndUpdate(
        req.user.id,
        { balance: newBalance, updatedAt: new Date() },
        { session }
      );

      const bet = new Bet({
        userId: req.user.id,
        period,
        type,
        value,
        amount,
        clientSeed,
        createdAt: new Date(),
      });
      await bet.save({ session });

      await session.commitTransaction();
      res.json({ bet, balance: newBalance });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in placeBet:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getCurrentRound = async (req, res) => {
  try {
    const roundDuration = 120 * 1000;
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const period = `round-${roundStart}`;
    const expiresAt = new Date(roundStart + roundDuration).toISOString();
    console.log(`[${new Date().toISOString()}] getCurrentRound:`, { now, period, expiresAt });

    const round = await createRound(period);

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
    console.error(`[${new Date().toISOString()}] Error in getCurrentRound:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.preGenerateRound = async (req, res) => {
  try {
    const { period } = req.body;
    console.log(`[${new Date().toISOString()}] preGenerateRound called with:`, { period, user: req.user?.id });

    if (!/^round-\d+$/.test(period)) {
      console.error(`[${new Date().toISOString()}] Invalid period format in preGenerateRound: ${period}`);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const round = await createRound(period);
    console.log(`[${new Date().toISOString()}] Round saved to DB:`, round);

    res.json(round);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in preGenerateRound:`, {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.triggerPreGenerateRounds = async (req, res) => {
  try {
    const { preGenerateRoundsFor24Hours } = require('../services/scheduler');
    const result = await preGenerateRoundsFor24Hours();
    console.log(`[${new Date().toISOString()}] Manual pre-generation triggered:`, result);
    res.json(result);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in triggerPreGenerateRounds:`, err.message, err.stack);
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
    console.log(`[${new Date().toISOString()}] Cleaned up invalid bets:`, result);
    res.json(result);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in cleanupInvalidBets:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.setRoundOutcome = async (req, res) => {
  try {
    const { period } = req.params;
    const { resultNumber, resultColor } = req.body;

    if (!/^round-\d+$/.test(period)) {
      console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const round = await Round.findOne({ period });
    if (!round) {
      console.error(`[${new Date().toISOString()}] Round not found: ${period}`);
      return res.status(404).json({ error: 'Round not found' });
    }

    round.resultNumber = resultNumber;
    round.resultColor = resultColor;
    round.updatedAt = new Date();
    round.isManuallySet = true;

    await round.save();
    console.log(`[${new Date().toISOString()}] Round outcome updated:`, { period, resultNumber, resultColor });
    res.json(round);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in setRoundOutcome:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getRoundResult = async (req, res) => {
  try {
    const { period } = req.params;
    console.log(`[${new Date().toISOString()}] Fetching round result:`, { period, adminId: req.admin?.id });

    if (!/^round-\d+$/.test(period)) {
      console.error(`[${new Date().toISOString()}] Invalid period format: ${period}`);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    const round = await Round.findOne({ period });
    if (!round) {
      console.error(`[${new Date().toISOString()}] Round not found: ${period}`);
      return res.status(404).json({ error: 'Round not found' });
    }

    res.json({
      period: round.period,
      result: {
        number: round.resultNumber.toString(),
        color: round.resultColor,
      },
      createdAt: round.createdAt,
      expiresAt: round.expiresAt,
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getRoundResult:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getAllRounds = async (req, res) => {
  try {
    const rounds = await Round.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('period resultNumber resultColor');

    const formattedRounds = rounds.map((round) => ({
      period: round.period,
      result: {
        color: round.resultColor || 'N/A',
        number: round.resultNumber !== undefined ? round.resultNumber.toString() : 'N/A',
      },
    }));

    console.log(`[${new Date().toISOString()}] Fetched all rounds:`, { count: formattedRounds.length });
    res.json(formattedRounds);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getAllRounds:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getSchedulerHealth = async (req, res) => {
  try {
    const { checkSchedulerHealth } = require('../services/scheduler');
    const health = await checkSchedulerHealth();
    res.json(health);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getSchedulerHealth:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
