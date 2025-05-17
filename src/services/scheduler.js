const cron = require('node-cron');
const Round = require('./models/Round'); // Path to your Round model
const crypto = require('crypto');

// Function to generate a round for a given period
async function generateRound(period) {
  try {
    // Check if round already exists
    const existingRound = await Round.findOne({ period });
    if (existingRound) {
      console.log(`Round already exists for ${period}:`, existingRound.period);
      return existingRound;
    }

    // Generate round outcome (same as preGenerateRound)
    const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
    const combined = `${serverSeed}-${period}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
    const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';

    // Create new round document
    const round = new Round({
      period,
      resultNumber,
      resultColor,
      createdAt: new Date(parseInt(period.split('-')[1])),
      expiresAt: new Date(parseInt(period.split('-')[1]) + 120 * 1000),
      serverSeed,
      isManuallySet: false,
    });

    // Save round atomically
    const savedRound = await Round.findOneAndUpdate(
      { period },
      { $setOnInsert: round },
      { upsert: true, new: true }
    );

    console.log(`Generated round for ${period}:`, {
      resultNumber: savedRound.resultNumber,
      resultColor: savedRound.resultColor,
      createdAt: savedRound.createdAt,
      expiresAt: savedRound.expiresAt,
    });
    return savedRound;
  } catch (err) {
    console.error(`Error generating round for ${period}:`, err.message, err.stack);
    throw err; // Optionally handle retries or alerts
  }
}

// Schedule round generation every 2 minutes at the start of the round
cron.schedule('0 */2 * * * *', async () => {
  const now = Date.now();
  const roundDuration = 120 * 1000; // 2 minutes
  const roundStart = Math.floor(now / roundDuration) * roundDuration;
  const period = `round-${roundStart}`;
  console.log(`Scheduling round generation for ${period} at ${new Date().toISOString()}`);
  await generateRound(period);
}, {
  timezone: 'Africa/Lagos' // WAT (UTC+1)
});

// Schedule next round generation 30 seconds into the current round
cron.schedule('30 */2 * * * *', async () => {
  const now = Date.now();
  const roundDuration = 120 * 1000;
  const nextRoundStart = Math.floor(now / roundDuration) * roundDuration + roundDuration;
  const period = `round-${nextRoundStart}`;
  console.log(`Scheduling next round generation for ${period} at ${new Date().toISOString()}`);
  await generateRound(period);
}, {
  timezone: 'Africa/Lagos'
});

// Log startup to confirm scheduler is running
console.log('Round generation scheduler started at', new Date().toISOString());
