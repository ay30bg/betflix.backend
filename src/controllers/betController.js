// src/controllers/betController.js
const Bet = require('../models/Bet');
const User = require('../models/User');

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

    const period = clientSeed.slice(0, 8);
    const existingBet = await Bet.findOne({ userId: req.user.id, period });
    if (existingBet) {
      return res.status(400).json({ error: `Duplicate bet with period ${period}` });
    }

    // Generate result (replace with provably fair system in production)
    const resultNumber = Math.floor(Math.random() * 10);
    const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

    let won = false;
    let payout = 0;

    if (type === 'color') {
      won = value === resultColor;
      payout = won ? amount * 2 : -amount;
    } else if (type === 'number') {
      if (value == resultNumber) { // Use == for string-to-number comparison
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
