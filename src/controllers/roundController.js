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

    // Validate period format
    if (!/^round-\d+$/.test(period)) {
      console.error('Invalid period format:', period);
      return res.status(400).json({ error: 'Invalid period format' });
    }

    // Validate resultNumber (0-9)
    if (!Number.isInteger(resultNumber) || resultNumber < 0 || resultNumber > 9) {
      console.error('Invalid resultNumber:', resultNumber);
      return res.status(400).json({ error: 'resultNumber must be an integer between 0 and 9' });
    }

    // Validate resultColor
    if (!['Green', 'Red'].includes(resultColor)) {
      console.error('Invalid resultColor:', resultColor);
      return res.status(400).json({ error: 'resultColor must be Green or Red' });
    }

    // Ensure admin authentication (assumed middleware sets req.admin)
    if (!req.admin || !req.admin.id) {
      console.error('Unauthorized attempt to set round outcome:', { period, adminId: req.admin?.id });
      return res.status(403).json({ error: 'Admin access required' });
    }

    const round = await Round.findOne({ period });
    if (!round) {
      console.error('Round not found:', period);
      return res.status(404).json({ error: 'Round not found' });
    }

    // Prevent updating expired rounds (optional, depending on requirements)
    const gracePeriod = 10000; // 10 seconds
    if (round.expiresAt < new Date() - gracePeriod) {
      console.error('Cannot update expired round:', { period, expiresAt: round.expiresAt });
      return res.status(400).json({ error: 'Cannot update expired round' });
    }

    // Update round
    round.resultNumber = resultNumber;
    round.resultColor = resultColor;
    round.isManuallySet = true; // Mark as manually set
    round.updatedAt = new Date();

    await round.save();
    console.log('Round outcome updated by admin:', {
      period,
      resultNumber,
      resultColor,
      adminId: req.admin.id,
      isManuallySet: true,
    });

    res.json({
      period: round.period,
      resultNumber: round.resultNumber,
      resultColor: round.resultColor,
      isManuallySet: round.isManuallySet,
      updatedAt: round.updatedAt,
    });
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
