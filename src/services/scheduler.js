// src/services/scheduler.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Round = require('../models/Round'); // Adjust path if needed
const crypto = require('crypto');

async function generateRound(period) {
  console.log(`Attempting to generate round for ${period}, MongoDB connected: ${mongoose.connection.readyState === 1}`);
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const existingRound = await Round.findOne({ period });
      if (existingRound) {
        console.log(`Round already exists for ${period}:`, existingRound.period);
        return existingRound;
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
        serverSeed,
        createdAt: new Date(parseInt(period.split('-')[1])),
        expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
        isManuallySet: false,
        updatedAt: new Date(),
      });

      const savedRound = await Round.findOneAndUpdate(
        { period },
        { $setOnInsert: round },
        { upsert: true, new: true }
      );

      console.log(`Generated round for ${period}:`, {
        period: savedRound.period,
        resultNumber: savedRound.resultNumber,
        resultColor: savedRound.resultColor,
        createdAt: savedRound.createdAt,
        expiresAt: savedRound.expiresAt,
      });
      return savedRound;
    } catch (err) {
      console.error(`Attempt ${attempt} failed for ${period}:`, {
        message: err.message,
        stack: err.stack,
        mongoConnected: mongoose.connection.readyState === 1,
      });
      if (err.code === 11000 && attempt < maxRetries) {
        console.log(`Duplicate key error, retrying (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
}

function startScheduler() {
  console.log('Starting scheduler, MongoDB connected:', mongoose.connection.readyState === 1);
  (async () => {
    try {
      const now = Date.now();
      const roundDuration = 120 * 1000;
      const currentRoundStart = Math.floor(now / roundDuration) * roundDuration;
      const nextRoundStart = currentRoundStart + roundDuration;
      console.log(`Generating initial rounds: current=round-${currentRoundStart}, next=round-${nextRoundStart}`);
      await generateRound(`round-${currentRoundStart}`);
      await generateRound(`round-${nextRoundStart}`);
      console.log('Initial rounds generated at', new Date().toISOString());
    } catch (err) {
      console.error('Error generating initial rounds:', {
        message: err.message,
        stack: err.stack,
        mongoConnected: mongoose.connection.readyState === 1,
      });
    }
  })();

  cron.schedule('0 */2 * * * *', async () => {
    try {
      const now = Date.now();
      const roundDuration = 120 * 1000;
      const roundStart = Math.floor(now / roundDuration) * roundDuration;
      const period = `round-${roundStart}`;
      console.log(`Cron triggered for current round: ${period} at ${new Date().toISOString()}`);
      await generateRound(period);
    } catch (err) {
      console.error('Error in current round schedule:', {
        message: err.message,
        stack: err.stack,
      });
    }
  }, {
    timezone: 'Africa/Lagos',
    scheduled: true,
  });

  cron.schedule('30 */2 * * * *', async () => {
    try {
      const now = Date.now();
      const roundDuration = 120 * 1000;
      const nextRoundStart = Math.floor(now / roundDuration) * roundDuration + roundDuration;
      const period = `round-${nextRoundStart}`;
      console.log(`Cron triggered for next round: ${period} at ${new Date().toISOString()}`);
      await generateRound(period);
    } catch (err) {
      console.error('Error in next round schedule:', {
        message: err.message,
        stack: err.stack,
      });
    }
  }, {
    timezone: 'Africa/Lagos',
    scheduled: true,
  });

  console.log('Round generation scheduler started at', new Date().toISOString());
}

async function checkSchedulerHealth() {
  try {
    const latestRound = await Round.findOne().sort({ createdAt: -1 });
    return {
      status: 'ok',
      latestRound: latestRound ? {
        period: latestRound.period,
        createdAt: latestRound.createdAt,
      } : null,
      mongoConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error checking scheduler health:', {
      message: err.message,
      stack: err.stack,
    });
    return {
      status: 'error',
      error: err.message,
      mongoConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testScheduler() {
  console.log('Running scheduler test...');
  try {
    const period = `round-${Math.floor(Date.now() / 120000) * 120000}`;
    await generateRound(period);
    console.log('Test round generation successful');
    const health = await checkSchedulerHealth();
    console.log('Scheduler health:', health);
  } catch (err) {
    console.error('Test scheduler failed:', {
      message: err.message,
      stack: err.stack,
    });
  }
}

module.exports = { startScheduler, generateRound, checkSchedulerHealth, testScheduler };
