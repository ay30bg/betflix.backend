// const crypto = require('crypto');
// const mongoose = require('mongoose');
// const Round = require('../models/Round');

// async function createRound(period) {
//   while (mongoose.connection.readyState !== 1) {
//     console.log(`[${new Date().toISOString()}] Waiting for MongoDB connection...`);
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }
//   const existingRound = await Round.findOne({ period });
//   if (existingRound) {
//     return existingRound;
//   }
//   const timestamp = parseInt(period.split('-')[1]);
//   const serverSeed = crypto.createHash('sha256').update(period).digest('hex');
//   const combined = `${serverSeed}-${period}`;
//   const hash = crypto.createHash('sha256').update(combined).digest('hex');
//   const resultNumber = parseInt(hash.slice(0, 8), 16) % 10;
//   const resultColor = resultNumber % 2 === 0 ? 'Green' : 'Red';
//   const round = new Round({
//     period,
//     resultNumber,
//     resultColor,
//     createdAt: new Date(timestamp),
//     expiresAt: new Date(timestamp + 120 * 1000),
//     serverSeed,
//     isManuallySet: false,
//     updatedAt: new Date(),
//   });
//   const savedRound = await Round.findOneAndUpdate(
//     { period },
//     { $setOnInsert: round },
//     { upsert: true, new: true }
//   );
//   console.log(`[${new Date().toISOString()}] Created round for ${period}:`, {
//     resultNumber: savedRound.resultNumber,
//     resultColor: savedRound.resultColor,
//   });
//   return savedRound;
// }

// module.exports = { createRound };


const mongoose = require('mongoose');
const Round = require('../models/Round');
const Bet = require('../models/Bet');

async function createRound(period) {
  // Wait for MongoDB connection
  while (mongoose.connection.readyState !== 1) {
    console.log(`[${new Date().toISOString()}] Waiting for MongoDB connection...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Check for existing round
  const existingRound = await Round.findOne({ period });
  if (existingRound) {
    console.log(`[${new Date().toISOString()}] Round already exists for ${period}`);
    return existingRound;
  }

  // Extract timestamp from period
  const timestamp = parseInt(period.split('-')[1]);

  // Create new round without setting resultNumber or resultColor
  const round = new Round({
    period,
    resultNumber: null, // To be calculated based on stakes
    resultColor: null, // To be calculated based on stakes
    createdAt: new Date(timestamp),
    expiresAt: new Date(timestamp + 120 * 1000),
    serverSeed: null,
    isManuallySet: false,
    updatedAt: new Date(),
  });

  // Save round with upsert to handle concurrent creation
  const savedRound = await Round.findOneAndUpdate(
    { period },
    { $setOnInsert: round },
    { upsert: true, new: true }
  );

  console.log(`[${new Date().toISOString()}] Created round for ${period}:`, {
    resultNumber: savedRound.resultNumber || 'Pending (to be calculated after round ends)',
    resultColor: savedRound.resultColor || 'Pending (to be calculated after round ends)',
  });

  return savedRound;
}

async function calculateRoundResult(period) {
  try {
    // Fetch all valid bets for the period
    const bets = await Bet.find({ period, status: { $ne: 'invalid' } }).lean();

    // Separate color and number bets
    const colorBets = bets.filter(bet => bet.type === 'color');
    const numberBets = bets.filter(bet => bet.type === 'number');

    // Calculate total stakes for colors
    const colorStakes = colorBets.reduce(
      (acc, bet) => {
        if (bet.value === 'Green') {
          acc.green += bet.amount;
        } else if (bet.value === 'Red') {
          acc.red += bet.amount;
        }
        return acc;
      },
      { green: 0, red: 0 }
    );

    // Calculate total stakes for numbers (0–9)
    const numberStakes = numberBets.reduce(
      (acc, bet) => {
        const num = parseInt(bet.value);
        if (num >= 0 && num <= 9) {
          acc[num] = (acc[num] || 0) + bet.amount;
        }
        return acc;
      },
      {}
    );

    // Determine resultColor
    let resultColor;
    if (colorBets.length === 0) {
      resultColor = ['Green', 'Red'][Math.floor(Math.random() * 2)];
      console.warn(`[${new Date().toISOString()}] No valid color bets for period ${period}, selected random color: ${resultColor}`);
    } else if (colorStakes.green === colorStakes.red) {
      resultColor = ['Green', 'Red'][Math.floor(Math.random() * 2)];
      console.log(`[${new Date().toISOString()}] Equal color stakes for period ${period}, randomly selected ${resultColor}`);
    } else {
      resultColor = colorStakes.green <= colorStakes.red ? 'Green' : 'Red';
    }

    // Determine resultNumber
    let resultNumber;
    if (numberBets.length === 0) {
      resultNumber = Math.floor(Math.random() * 10);
      console.warn(`[${new Date().toISOString()}] No valid number bets for period ${period}, selected random number: ${resultNumber}`);
    } else {
      // Find the number with the lowest stake
      const minStake = Math.min(...Object.values(numberStakes).filter(val => val > 0));
      const minStakeNumbers = Object.keys(numberStakes)
        .filter(num => numberStakes[num] === minStake || (!numberStakes[num] && minStake === Infinity))
        .map(num => parseInt(num));
      // If no stakes (all numbers unbetted), include all numbers (0–9)
      if (minStake === Infinity) {
        minStakeNumbers.push(...Array.from({ length: 10 }, (_, i) => i).filter(i => !numberStakes[i]));
      }
      // Pick a random number from those with the lowest stake
      resultNumber = minStakeNumbers[Math.floor(Math.random() * minStakeNumbers.length)];
      console.log(`[${new Date().toISOString()}] Number stakes for period ${period}:`, {
        stakes: numberStakes,
        minStakeNumbers,
        selectedNumber: resultNumber,
      });
    }

    console.log(`[${new Date().toISOString()}] Calculated round result for ${period}:`, {
      greenStake: colorStakes.green,
      redStake: colorStakes.red,
      resultColor,
      numberStakes,
      resultNumber,
    });

    return {
      resultColor,
      resultNumber,
    };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error calculating round result for ${period}:`, err.message);
    throw err;
  }
}

module.exports = { createRound, calculateRoundResult };
