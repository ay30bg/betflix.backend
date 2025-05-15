const Round = require('../models/Round');
const crypto = require('crypto');

exports.getCurrentRound = async (req, res) => {
  try {
    const roundDuration = 120 * 1000; // 2 minutes
    const now = Date.now();
    const roundStart = Math.floor(now / roundDuration) * roundDuration;
    const period = `round-${roundStart}`;
    const expiresAt = new Date(roundStart + roundDuration).toISOString();

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

    res.json(savedRound);
  } catch (err) {
    console.error('Error in preGenerateRound:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.setRoundOutcome = async (req, res) => {
  try {
    const { period } = req.params;
    const { resultNumber, resultColor } = req.body;

    // Validation is handled by express-validator in the route

    const round = await Round.findOne({ period });
    if (!round) {
      console.error('Round not found:', period);
      return res.status(404).json({ error: 'Round not found' });
    }

    if (round.resultNumber !== undefined && round.resultColor && round.updatedAt) {
      console.error('Round result already finalized:', period);
      return res.status(400).json({ error: 'Round result already set' });
    }

    round.resultNumber = resultNumber;
    round.resultColor = resultColor;
    round.updatedAt = new Date();

    await round.save();
    console.log('Round outcome updated:', { period, resultNumber, resultColor });

    res.json(round);
  } catch (err) {
    console.error('Error in setRoundOutcome:', err.message, err.stack);
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

    res.json(formattedRounds);
  } catch (err) {
    console.error('Error in getAllRounds:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
