const Bet = require('../models/Bet');

const getBetHistory = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bet history' });
  }
};

const getBetStats = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id });

    const stats = {
      totalBets: bets.length,
      wins: bets.filter((bet) => bet.won).length,
      losses: bets.filter((bet) => !bet.won).length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch betting stats' });
  }
};

module.exports = { getBetHistory, getBetStats };