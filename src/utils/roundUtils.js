const crypto = require('crypto');
const mongoose = require('mongoose');
const Round = require('../models/Round');

async function createRound(period) {
  while (mongoose.connection.readyState !== 1) {
    console.log(`[${new Date().toISOString()}] Waiting for MongoDB connection...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const existingRound = await Round.findOne({ period });
  if (existingRound) {
    return existingRound;
  }
  const timestamp = parseInt(period.split('-')[1]);
  const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
  const combined = `${serverSeed}-${period}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
  const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';
  const round = new Round({
    period,
    resultNumber,
    resultColor,
    createdAt: new Date(timestamp),
    expiresAt: new Date(timestamp + 120 * 1000),
    serverSeed,
    isManuallySet: false,
    updatedAt: new Date(),
  });
  const savedRound = await Round.findOneAndUpdate(
    { period },
    { $setOnInsert: round },
    { upsert: true, new: true }
  );
  console.log(`[${new Date().toISOString()}] Created round for ${period}:`, {
    resultNumber: savedRound.resultNumber,
    resultColor: savedRound.resultColor,
  });
  return savedRound;
}

module.exports = { createRound };
