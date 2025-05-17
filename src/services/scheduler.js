// // src/services/scheduler.js
// const cron = require('node-cron');
// const mongoose = require('mongoose');
// const Round = require('../models/Round'); // Adjust path if needed
// const crypto = require('crypto');

// async function generateRound(period) {
//   console.log(`Attempting to generate round for ${period}, MongoDB connected: ${mongoose.connection.readyState === 1}`);
//   const maxRetries = 3;
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       const existingRound = await Round.findOne({ period });
//       if (existingRound) {
//         console.log(`Round already exists for ${period}:`, existingRound.period);
//         return existingRound;
//       }

//       const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
//       const combined = `${serverSeed}-${period}`;
//       const hash = crypto.createHash('sha256').update(combined).digest('hex');
//       const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
//       const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

//       const round = new Round({
//         period,
//         resultNumber,
//         resultColor,
//         serverSeed,
//         createdAt: new Date(parseInt(period.split('-')[1])),
//         expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
//         isManuallySet: false,
//         updatedAt: new Date(),
//       });

//       const savedRound = await Round.findOneAndUpdate(
//         { period },
//         { $setOnInsert: round },
//         { upsert: true, new: true }
//       );

//       console.log(`Generated round for ${period}:`, {
//         period: savedRound.period,
//         resultNumber: savedRound.resultNumber,
//         resultColor: savedRound.resultColor,
//         createdAt: savedRound.createdAt,
//         expiresAt: savedRound.expiresAt,
//       });
//       return savedRound;
//     } catch (err) {
//       console.error(`Attempt ${attempt} failed for ${period}:`, {
//         message: err.message,
//         stack: err.stack,
//         mongoConnected: mongoose.connection.readyState === 1,
//       });
//       if (err.code === 11000 && attempt < maxRetries) {
//         console.log(`Duplicate key error, retrying (${attempt + 1}/${maxRetries})...`);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         continue;
//       }
//       throw err;
//     }
//   }
// }

// function startScheduler() {
//   console.log('Starting scheduler, MongoDB connected:', mongoose.connection.readyState === 1);
//   (async () => {
//     try {
//       const now = Date.now();
//       const roundDuration = 120 * 1000;
//       const currentRoundStart = Math.floor(now / roundDuration) * roundDuration;
//       const nextRoundStart = currentRoundStart + roundDuration;
//       console.log(`Generating initial rounds: current=round-${currentRoundStart}, next=round-${nextRoundStart}`);
//       await generateRound(`round-${currentRoundStart}`);
//       await generateRound(`round-${nextRoundStart}`);
//       console.log('Initial rounds generated at', new Date().toISOString());
//     } catch (err) {
//       console.error('Error generating initial rounds:', {
//         message: err.message,
//         stack: err.stack,
//         mongoConnected: mongoose.connection.readyState === 1,
//       });
//     }
//   })();

//   cron.schedule('0 */2 * * * *', async () => {
//     try {
//       const now = Date.now();
//       const roundDuration = 120 * 1000;
//       const roundStart = Math.floor(now / roundDuration) * roundDuration;
//       const period = `round-${roundStart}`;
//       console.log(`Cron triggered for current round: ${period} at ${new Date().toISOString()}`);
//       await generateRound(period);
//     } catch (err) {
//       console.error('Error in current round schedule:', {
//         message: err.message,
//         stack: err.stack,
//       });
//     }
//   }, {
//     timezone: 'Africa/Lagos',
//     scheduled: true,
//   });

//   cron.schedule('30 */2 * * * *', async () => {
//     try {
//       const now = Date.now();
//       const roundDuration = 120 * 1000;
//       const nextRoundStart = Math.floor(now / roundDuration) * roundDuration + roundDuration;
//       const period = `round-${nextRoundStart}`;
//       console.log(`Cron triggered for next round: ${period} at ${new Date().toISOString()}`);
//       await generateRound(period);
//     } catch (err) {
//       console.error('Error in next round schedule:', {
//         message: err.message,
//         stack: err.stack,
//       });
//     }
//   }, {
//     timezone: 'Africa/Lagos',
//     scheduled: true,
//   });

//   console.log('Round generation scheduler started at', new Date().toISOString());
// }

// async function checkSchedulerHealth() {
//   try {
//     const latestRound = await Round.findOne().sort({ createdAt: -1 });
//     return {
//       status: 'ok',
//       latestRound: latestRound ? {
//         period: latestRound.period,
//         createdAt: latestRound.createdAt,
//       } : null,
//       mongoConnected: mongoose.connection.readyState === 1,
//       timestamp: new Date().toISOString(),
//     };
//   } catch (err) {
//     console.error('Error checking scheduler health:', {
//       message: err.message,
//       stack: err.stack,
//     });
//     return {
//       status: 'error',
//       error: err.message,
//       mongoConnected: mongoose.connection.readyState === 1,
//       timestamp: new Date().toISOString(),
//     };
//   }
// }

// async function testScheduler() {
//   console.log('Running scheduler test...');
//   try {
//     const period = `round-${Math.floor(Date.now() / 120000) * 120000}`;
//     await generateRound(period);
//     console.log('Test round generation successful');
//     const health = await checkSchedulerHealth();
//     console.log('Scheduler health:', health);
//   } catch (err) {
//     console.error('Test scheduler failed:', {
//       message: err.message,
//       stack: err.stack,
//     });
//   }
// }

// module.exports = { startScheduler, generateRound, checkSchedulerHealth, testScheduler };

const cron = require('node-cron');
const mongoose = require('mongoose');
const Round = require('../models/Round');
const crypto = require('crypto');

// Ensure MongoDB connection is stable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
}).catch(err => console.error(`[${new Date().toISOString()}] MongoDB initial connection failed:`, err));

mongoose.connection.on('disconnected', () => {
  console.log(`[${new Date().toISOString()}] MongoDB disconnected, attempting to reconnect...`);
});
mongoose.connection.on('reconnected', () => {
  console.log(`[${new Date().toISOString()}] MongoDB reconnected`);
});

async function generateRound(period, timestamp) {
  console.log(`[${new Date().toISOString()}] Attempting to generate round for ${period}, MongoDB connected: ${mongoose.connection.readyState === 1}`);
  try {
    const existingRound = await Round.findOne({ period });
    if (existingRound) {
      console.log(`[${new Date().toISOString()}] Round already exists for ${period}:`, existingRound.period);
      return existingRound;
    }

    const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
    const combined = `${serverSeed}-${period}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
    const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

    const round = {
      period,
      resultNumber,
      resultColor,
      serverSeed,
      createdAt: new Date(timestamp),
      expiresAt: new Date(timestamp + 120 * 1000),
      isManuallySet: false,
      updatedAt: new Date(),
    };

    const savedRound = await Round.findOneAndUpdate(
      { period },
      { $setOnInsert: round },
      { upsert: true, new: true }
    );

    console.log(`[${new Date().toISOString()}] Generated round for ${period}:`, {
      period: savedRound.period,
      resultNumber: savedRound.resultNumber,
      resultColor: savedRound.resultColor,
      createdAt: savedRound.createdAt,
      expiresAt: savedRound.expiresAt,
    });
    return savedRound;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error generating round for ${period}:`, {
      message: err.message,
      stack: err.stack,
      mongoConnected: mongoose.connection.readyState === 1,
    });
    throw err;
  }
}

async function preGenerateRoundsFor24Hours() {
  console.log(`[${new Date().toISOString()}] Starting pre-generation of rounds for 24 hours, MongoDB connected: ${mongoose.connection.readyState === 1}`);
  while (mongoose.connection.readyState !== 1) {
    console.log(`[${new Date().toISOString()}] Waiting for MongoDB connection...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const roundDuration = 120 * 1000; // 2 minutes
  const roundsPerDay = 24 * 60 / 2; // 720 rounds
  const now = Date.now();
  const startTime = Math.floor(now / roundDuration) * roundDuration; // Align to nearest 2-minute boundary
  const roundsToGenerate = [];

  // Generate round data
  for (let i = 0; i < roundsPerDay; i++) {
    const timestamp = startTime + i * roundDuration;
    const period = `round-${timestamp}`;
    roundsToGenerate.push({ period, timestamp });
  }

  let successfulCount = 0;
  let skippedCount = 0;

  // Process rounds in batches
  const batchSize = 100;
  for (let i = 0; i < roundsToGenerate.length; i += batchSize) {
    const batch = roundsToGenerate.slice(i, i + batchSize);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const { period, timestamp } of batch) {
        try {
          await generateRound(period, timestamp);
          successfulCount++;
        } catch (err) {
          if (err.code === 11000) {
            console.log(`[${new Date().toISOString()}] Skipping duplicate round: ${period}`);
            skippedCount++;
            continue;
          }
          throw err;
        }
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error(`[${new Date().toISOString()}] Error in batch ${i / batchSize + 1}:`, {
        message: err.message,
        stack: err.stack,
      });
      throw err;
    } finally {
      session.endSession();
    }
  }

  console.log(`[${new Date().toISOString()}] Pre-generation complete: ${successfulCount} rounds created, ${skippedCount} rounds skipped`);
  return { successfulCount, skippedCount };
}

function startScheduler() {
  console.log(`[${new Date().toISOString()}] Starting scheduler, MongoDB connected: ${mongoose.connection.readyState === 1}`);
  while (mongoose.connection.readyState !== 1) {
    console.log(`[${new Date().toISOString()}] Waiting for MongoDB connection...`);
    new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Pre-generate rounds for 24 hours on startup
  (async () => {
    try {
      await preGenerateRoundsFor24Hours();
      console.log(`[${new Date().toISOString()}] Initial 24-hour round pre-generation complete`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error pre-generating rounds:`, {
        message: err.message,
        stack: err.stack,
      });
    }
  })();

  // Schedule daily pre-generation at midnight (Africa/Lagos)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Daily pre-generation triggered`);
      await preGenerateRoundsFor24Hours();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error in daily pre-generation:`, {
        message: err.message,
        stack: err.stack,
      });
    }
  }, { timezone: 'Africa/Lagos' });

  // Fallback cron jobs for real-time generation
  let isRunning = false;
  cron.schedule('0 */2 * * * *', async () => {
    if (isRunning) {
      console.log(`[${new Date().toISOString()}] Skipping current round cron, previous job running`);
      return;
    }
    isRunning = true;
    try {
      const now = Date.now();
      const roundDuration = 120 * 1000;
      const roundStart = Math.floor(now / roundDuration) * roundDuration;
      const period = `round-${roundStart}`;
      await generateRound(period, roundStart);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error in current round schedule:`, {
        message: err.message,
        stack: err.stack,
      });
    } finally {
      isRunning = false;
    }
  }, { timezone: 'Africa/Lagos' });

  cron.schedule('30 */2 * * * *', async () => {
    if (isRunning) {
      console.log(`[${new Date().toISOString()}] Skipping next round cron, previous job running`);
      return;
    }
    isRunning = true;
    try {
      const now = Date.now();
      const roundDuration = 120 * 1000;
      const nextRoundStart = Math.floor(now / roundDuration) * roundDuration + roundDuration;
      const period = `round-${nextRoundStart}`;
      await generateRound(period, nextRoundStart);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error in next round schedule:`, {
        message: err.message,
        stack: err.stack,
      });
    } finally {
      isRunning = false;
    }
  }, { timezone: 'Africa/Lagos' });

  console.log(`[${new Date().toISOString()}] Scheduler started`);
}

async function checkSchedulerHealth() {
  try {
    const latestRound = await Round.findOne().sort({ createdAt: -1 });
    const roundCount = await Round.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    return {
      status: 'ok',
      latestRound: latestRound ? {
        period: latestRound.period,
        createdAt: latestRound.createdAt,
      } : null,
      roundCount24Hours: roundCount,
      mongoConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error checking scheduler health:`, {
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
  console.log(`[${new Date().toISOString()}] Running scheduler test...`);
  try {
    await preGenerateRoundsFor24Hours();
    const health = await checkSchedulerHealth();
    console.log(`[${new Date().toISOString()}] Scheduler health:`, health);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Test scheduler failed:`, {
      message: err.message,
      stack: err.stack,
    });
  }
}

module.exports = { startScheduler, generateRound, checkSchedulerHealth, testScheduler, preGenerateRoundsFor24Hours };
