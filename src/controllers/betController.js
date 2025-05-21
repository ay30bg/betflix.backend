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
//       .limit(10)
//       .lean();

//     const processedBets = await Promise.all(
//       bets.map(async (bet) => {
//         if (!bet.type || !bet.value || !bet.amount || !bet.period) {
//           await Bet.updateOne(
//             { _id: bet._id },
//             { status: 'invalid', updatedAt: new Date(), error: 'Missing required fields' }
//           );
//           return { ...bet, status: 'invalid', error: 'Missing required fields' };
//         }

//         if (bet.status === 'finalized') {
//           return { ...bet, status: 'finalized' };
//         }

//         const round = await Round.findOne({ period: bet.period }).lean();
//         if (!round) {
//           const session = await Bet.startSession();
//           session.startTransaction();
//           try {
//             const user = await User.findById(bet.userId).session(session);
//             if (user) {
//               const newBalance = user.balance + bet.amount;
//               await User.findByIdAndUpdate(
//                 bet.userId,
//                 { $set: { balance: newBalance, updatedAt: new Date() } },
//                 { session }
//               );
//               await Bet.updateOne(
//                 { _id: bet._id },
//                 {
//                   status: 'invalid',
//                   updatedAt: new Date(),
//                   error: 'Round data missing, bet refunded',
//                 },
//                 { session }
//               );
//               await session.commitTransaction();
//               console.log(`[${new Date().toISOString()}] Refunded bet in getBetHistory:`, {
//                 betId: bet._id,
//                 userId: bet.userId,
//                 period: bet.period,
//                 refundedAmount: bet.amount,
//                 newBalance,
//               });
//               return {
//                 ...bet,
//                 status: 'invalid',
//                 roundStatus: 'not_found',
//                 error: 'Round data missing, bet refunded',
//                 newBalance,
//               };
//             } else {
//               await Bet.updateOne(
//                 { _id: bet._id },
//                 {
//                   status: 'invalid',
//                   updatedAt: new Date(),
//                   error: 'Round data missing, user not found',
//                 },
//                 { session }
//               );
//               await session.commitTransaction();
//               console.warn(`[${new Date().toISOString()}] Marked bet invalid (user not found) in getBetHistory:`, {
//                 betId: bet._id,
//                 userId: bet.userId,
//                 period: bet.period,
//               });
//               return {
//                 ...bet,
//                 status: 'invalid',
//                 roundStatus: 'not_found',
//                 error: 'Round data missing, user not found',
//               };
//             }
//           } catch (err) {
//             await session.abortTransaction();
//             console.error(`[${new Date().toISOString()}] Error refunding bet in getBetHistory:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               error: err.message,
//             });
//             return {
//               ...bet,
//               status: 'pending',
//               roundStatus: 'not_found',
//               error: 'Failed to process bet refund',
//             };
//           } finally {
//             session.endSession();
//           }
//         }

//         const now = Date.now();
//         if (round.expiresAt < new Date(now)) {
//           const session = await Bet.startSession();
//           session.startTransaction();
//           try {
//             const { resultNumber, resultColor } = round;
//             let won = false;
//             let payout = 0;

//             if (bet.type === 'color') {
//               won = bet.value === resultColor;
//               payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
//             } else if (bet.type === 'number') {
//               won = parseInt(bet.value) === resultNumber;
//               payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
//             }

//             await Bet.updateOne(
//               { _id: bet._id },
//               {
//                 result: bet.type === 'color' ? resultColor : resultNumber.toString(),
//                 won,
//                 payout,
//                 status: 'finalized',
//                 updatedAt: new Date(),
//               },
//               { session }
//             );

//             const user = await User.findById(bet.userId).session(session);
//             if (!user) {
//               throw new Error('User not found');
//             }

//             const newBalance = user.balance + payout;
//             await User.findByIdAndUpdate(
//               bet.userId,
//               { $set: { balance: newBalance, updatedAt: new Date() } },
//               { session }
//             );

//             await session.commitTransaction();
//             console.log(`[${new Date().toISOString()}] Finalized bet in getBetHistory:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               won,
//               payout,
//               newBalance,
//             });

//             return {
//               ...bet,
//               result: bet.type === 'color' ? resultColor : resultNumber.toString(),
//               won,
//               payout,
//               status: 'finalized',
//               newBalance,
//             };
//           } catch (err) {
//             await session.abortTransaction();
//             console.error(`[${new Date().toISOString()}] Error finalizing bet in getBetHistory:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               error: err.message,
//             });
//             return { ...bet, status: 'pending', roundStatus: 'error_finalizing' };
//           } finally {
//             session.endSession();
//           }
//         }

//         return {
//           ...bet,
//           status: 'pending',
//           roundStatus: 'active',
//           roundExpiresAt: round.expiresAt,
//         };
//       })
//     );

//     res.json(processedBets);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getBetHistory:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getPendingBets = async (req, res) => {
//   try {
//     const bets = await Bet.find({
//       userId: req.user.id,
//       status: 'pending',
//     })
//       .sort({ createdAt: -1 })
//       .lean();

//     const processedBets = await Promise.all(
//       bets.map(async (bet) => {
//         if (!bet.type || !bet.value || !bet.amount || !bet.period) {
//           await Bet.updateOne(
//             { _id: bet._id },
//             { status: 'invalid', updatedAt: new Date(), error: 'Missing required fields' }
//           );
//           return { ...bet, status: 'invalid', error: 'Missing required fields' };
//         }

//         const round = await Round.findOne({ period: bet.period }).lean();
//         if (!round) {
//           const session = await Bet.startSession();
//           session.startTransaction();
//           try {
//             const user = await User.findById(bet.userId).session(session);
//             if (user) {
//               const newBalance = user.balance + bet.amount;
//               await User.findByIdAndUpdate(
//                 bet.userId,
//                 { $set: { balance: newBalance, updatedAt: new Date() } },
//                 { session }
//               );
//               await Bet.updateOne(
//                 { _id: bet._id },
//                 {
//                   status: 'invalid',
//                   updatedAt: new Date(),
//                   error: 'Round data missing, bet refunded',
//                 },
//                 { session }
//               );
//               await session.commitTransaction();
//               console.log(`[${new Date().toISOString()}] Refunded bet in getPendingBets:`, {
//                 betId: bet._id,
//                 userId: bet.userId,
//                 period: bet.period,
//                 refundedAmount: bet.amount,
//                 newBalance,
//               });
//               return {
//                 ...bet,
//                 status: 'invalid',
//                 roundStatus: 'not_found',
//                 error: 'Round data missing, bet refunded',
//                 newBalance,
//               };
//             } else {
//               await Bet.updateOne(
//                 { _id: bet._id },
//                 {
//                   status: 'invalid',
//                   updatedAt: new Date(),
//                   error: 'Round data missing, user not found',
//                 },
//                 { session }
//               );
//               await session.commitTransaction();
//               console.warn(`[${new Date().toISOString()}] Marked bet invalid (user not found) in getPendingBets:`, {
//                 betId: bet._id,
//                 userId: bet.userId,
//                 period: bet.period,
//               });
//               return {
//                 ...bet,
//                 status: 'invalid',
//                 roundStatus: 'not_found',
//                 error: 'Round data missing, user not found',
//               };
//             }
//           } catch (err) {
//             await session.abortTransaction();
//             console.error(`[${new Date().toISOString()}] Error refunding bet in getPendingBets:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               error: err.message,
//             });
//             return {
//               ...bet,
//               status: 'pending',
//               roundStatus: 'not_found',
//               error: 'Failed to process bet refund',
//             };
//           } finally {
//             session.endSession();
//           }
//         }

//         if (round.expiresAt < new Date()) {
//           const session = await Bet.startSession();
//           session.startTransaction();
//           try {
//             const { resultNumber, resultColor } = round;
//             let won = false;
//             let payout = 0;

//             if (bet.type === 'color') {
//               won = bet.value === resultColor;
//               payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
//             } else if (bet.type === 'number') {
//               won = parseInt(bet.value) === resultNumber;
//               payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
//             }

//             await Bet.updateOne(
//               { _id: bet._id },
//               {
//                 result: bet.type === 'color' ? resultColor : resultNumber.toString(),
//                 won,
//                 payout,
//                 status: 'finalized',
//                 updatedAt: new Date(),
//               },
//               { session }
//             );

//             const user = await User.findById(bet.userId).session(session);
//             if (!user) {
//               throw new Error('User not found');
//             }

//             const newBalance = user.balance + payout;
//             await User.findByIdAndUpdate(
//               bet.userId,
//               { $set: { balance: newBalance, updatedAt: new Date() } },
//               { session }
//             );

//             await session.commitTransaction();
//             console.log(`[${new Date().toISOString()}] Finalized bet in getPendingBets:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               won,
//               payout,
//               newBalance,
//             });

//             return {
//               ...bet,
//               result: bet.type === 'color' ? resultColor : resultNumber.toString(),
//               won,
//               payout,
//               status: 'finalized',
//               newBalance,
//             };
//           } catch (err) {
//             await session.abortTransaction();
//             console.error(`[${new Date().toISOString()}] Error finalizing bet in getPendingBets:`, {
//               betId: bet._id,
//               userId: bet.userId,
//               period: bet.period,
//               error: err.message,
//             });
//             return { ...bet, status: 'pending', roundStatus: 'error_finalizing' };
//           } finally {
//             session.endSession();
//           }
//         }

//         return {
//           ...bet,
//           status: 'pending',
//           roundStatus: 'active',
//           roundExpiresAt: round.expiresAt,
//         };
//       })
//     );

//     res.json(processedBets);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getPendingBets:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.getBetStats = async (req, res) => {
//   try {
//     const bets = await Bet.find({ userId: req.user.id });

//     const finalizedBets = bets.filter((bet) => bet.status === 'finalized');
//     const pendingBets = bets.filter((bet) => bet.status === 'pending');

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

//     await createRound(period);

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
//         { $set: { balance: newBalance, updatedAt: new Date() } },
//         { session }
//       );

//       const bet = new Bet({
//         userId: req.user.id,
//         period,
//         type,
//         value,
//         amount,
//         clientSeed,
//         status: 'pending',
//         createdAt: new Date(),
//       });
//       await bet.save({ session });

//       await session.commitTransaction();
//       console.log(`[${new Date().toISOString()}] Bet placed:`, {
//         betId: bet._id,
//         userId: req.user.id,
//         period,
//         amount,
//         newBalance,
//       });
//       res.json({ bet, balance: newBalance });
//     } catch (err) {
//       await session.abortTransaction();
//       console.error(`[${new Date().toISOString()}] Error in placeBet:`, {
//         userId: req.user.id,
//         period,
//         error: err.message,
//       });
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
//     console.log(`[${new Date().toISOString()}] Fetching bet result:`, { period, userId });

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
//       console.error(`[${new Date().toISOString()}] Invalid bet type:`, { betId: bet._id, type: bet.type });
//       return res.status(400).json({ error: 'Invalid bet type' });
//     }
//     if (bet.type === 'color' && !validColors.includes(bet.value)) {
//       console.error(`[${new Date().toISOString()}] Invalid color value:`, { betId: bet._id, value: bet.value });
//       return res.status(400).json({ error: 'Invalid color value' });
//     }
//     if (bet.type === 'number' && !/^\d$/.test(bet.value)) {
//       console.error(`[${new Date().toISOString()}] Invalid number value:`, { betId: bet._id, value: bet.value });
//       return res.status(400).json({ error: 'Invalid number value' });
//     }

//     if (bet.status === 'finalized') {
//       console.log(`[${new Date().toISOString()}] Returning existing bet result:`, {
//         betId: bet._id,
//         won: bet.won,
//         payout: bet.payout,
//       });
//       const user = await User.findById(userId).select('balance');
//       return res.json({ bet, balance: user ? user.balance : null });
//     }

//     const round = await Round.findOne({ period });
//     if (!round) {
//       const session = await Bet.startSession();
//       session.startTransaction();
//       try {
//         const user = await User.findById(userId).session(session);
//         if (!user) {
//           throw new Error('User not found');
//         }

//         const newBalance = user.balance + bet.amount;
//         await User.findByIdAndUpdate(
//           userId,
//           { $set: { balance: newBalance, updatedAt: new Date() } },
//           { session }
//         );

//         await Bet.updateOne(
//           { _id: bet._id },
//           {
//             status: 'invalid',
//             updatedAt: new Date(),
//             error: 'Round data missing, bet refunded',
//           },
//           { session }
//         );

//         await session.commitTransaction();
//         console.log(`[${new Date().toISOString()}] Refunded bet in getBetResult:`, {
//           betId: bet._id,
//           userId,
//           period,
//           refundedAmount: bet.amount,
//           newBalance,
//         });
//         return res.json({
//           bet: {
//             ...bet.toObject(),
//             status: 'invalid',
//             error: 'Round data missing, bet refunded',
//           },
//           balance: newBalance,
//         });
//       } catch (err) {
//         await session.abortTransaction();
//         console.error(`[${new Date().toISOString()}] Error refunding bet in getBetResult:`, {
//           betId: bet._id,
//           userId,
//           period,
//           error: err.message,
//         });
//         return res.status(500).json({ error: 'Server error', details: err.message });
//       } finally {
//         session.endSession();
//       }
//     }

//     const { resultNumber, resultColor } = round;
//     let won = false;
//     let payout = 0;

//     if (bet.type === 'color') {
//       won = bet.value === resultColor;
//       payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
//     } else if (bet.type === 'number') {
//       won = parseInt(bet.value) === resultNumber;
//       payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
//     }

//     console.log(`[${new Date().toISOString()}] Bet result calculated:`, {
//       betId: bet._id,
//       userId,
//       period,
//       won,
//       payout,
//       resultNumber,
//       resultColor,
//       isManuallySet: round.isManuallySet,
//     });

//     const session = await Bet.startSession();
//     session.startTransaction();
//     try {
//       await Bet.updateOne(
//         { _id: bet._id },
//         {
//           result: bet.type === 'color' ? resultColor : resultNumber.toString(),
//           won,
//           payout,
//           status: 'finalized',
//           updatedAt: new Date(),
//         },
//         { session }
//       );

//       const updatedBet = await Bet.findById(bet._id).session(session);
//       if (!updatedBet) {
//         throw new Error('Bet not found after update');
//       }

//       const user = await User.findById(userId).session(session);
//       if (!user) {
//         throw new Error('User not found');
//       }

//       const newBalance = user.balance + payout;
//       await User.findByIdAndUpdate(
//         userId,
//         { $set: { balance: newBalance, updatedAt: new Date() } },
//         { session }
//       );

//       await session.commitTransaction();
//       console.log(`[${new Date().toISOString()}] Finalized bet and updated balance:`, {
//         betId: bet._id,
//         userId,
//         period,
//         won,
//         payout,
//         newBalance,
//       });

//       res.json({ bet: updatedBet, balance: newBalance });
//     } catch (err) {
//       await session.abortTransaction();
//       console.error(`[${new Date().toISOString()}] Error finalizing bet in getBetResult:`, {
//         betId: bet._id,
//         userId,
//         period,
//         error: err.message,
//       });
//       return res.status(500).json({ error: 'Server error', details: err.message });
//     } finally {
//       session.endSession();
//     }
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getBetResult:`, err.message, err.stack);
//     res.status(500).json({ error: 'Server error', details: err.message });
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
//     const roundDuration = 120 * 1000;
//     const now = Date.now();
//     const roundsToGenerate = 24 * 60 * 60 * 1000 / roundDuration;
//     const generatedRounds = [];

//     for (let i = 0; i < roundsToGenerate; i++) {
//       const roundStart = Math.floor((now + i * roundDuration) / roundDuration) * roundDuration;
//       const period = `round-${roundStart}`;
//       const round = await createRound(period);
//       generatedRounds.push(period);
//     }

//     console.log(`[${new Date().toISOString()}] Manual pre-generation triggered:`, {
//       count: generatedRounds.length,
//     });
//     res.json({ count: generatedRounds.length, periods: generatedRounds });
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

// exports.getRecentRounds = async (req, res) => {
//   try {
//     const now = new Date();
//     const rounds = await Round.find({
//       expiresAt: { $lt: now },
//     })
//       .sort({ expiresAt: -1 })
//       .limit(10)
//       .select('period resultNumber resultColor expiresAt')
//       .lean();

//     const formattedRounds = rounds.map((round) => ({
//       period: round.period,
//       result: {
//         color: round.resultColor || 'N/A',
//         number: round.resultNumber !== undefined ? round.resultNumber.toString() : 'N/A',
//       },
//       expiresAt: round.expiresAt,
//     }));

//     console.log(`[${new Date().toISOString()}] Fetched recent past rounds:`, { count: formattedRounds.length });
//     res.json(formattedRounds);
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] Error in getRecentRounds:`, err.message, err.stack);
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
const { createRound, calculateRoundResult } = require('../utils/roundUtils');

const PAYOUT_MULTIPLIERS = {
  color: 1.9,
  number: 6.8,
};

exports.getBetHistory = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const processedBets = await Promise.all(
      bets.map(async (bet) => {
        if (!bet.type || !bet.value || !bet.amount || !bet.period) {
          await Bet.updateOne(
            { _id: bet._id },
            { status: 'invalid', updatedAt: new Date(), error: 'Missing required fields' }
          );
          return { ...bet, status: 'invalid', error: 'Missing required fields' };
        }

        if (bet.status === 'finalized') {
          return { ...bet, status: 'finalized' };
        }

        const round = await Round.findOne({ period: bet.period }).lean();
        if (!round) {
          const session = await Bet.startSession();
          session.startTransaction();
          try {
            const user = await User.findById(bet.userId).session(session);
            if (user) {
              const newBalance = user.balance + bet.amount;
              await User.findByIdAndUpdate(
                bet.userId,
                { $set: { balance: newBalance, updatedAt: new Date() } },
                { session }
              );
              await Bet.updateOne(
                { _id: bet._id },
                {
                  status: 'invalid',
                  updatedAt: new Date(),
                  error: 'Round data missing, bet refunded',
                },
                { session }
              );
              await session.commitTransaction();
              console.log(`[${new Date().toISOString()}] Refunded bet in getBetHistory:`, {
                betId: bet._id,
                userId: bet.userId,
                period: bet.period,
                refundedAmount: bet.amount,
                newBalance,
              });
              return {
                ...bet,
                status: 'invalid',
                roundStatus: 'not_found',
                error: 'Round data missing, bet refunded',
                newBalance,
              };
            } else {
              await Bet.updateOne(
                { _id: bet._id },
                {
                  status: 'invalid',
                  updatedAt: new Date(),
                  error: 'Round data missing, user not found',
                },
                { session }
              );
              await session.commitTransaction();
              console.warn(`[${new Date().toISOString()}] Marked bet invalid (user not found) in getBetHistory:`, {
                betId: bet._id,
                userId: bet.userId,
                period: bet.period,
              });
              return {
                ...bet,
                status: 'invalid',
                roundStatus: 'not_found',
                error: 'Round data missing, user not found',
              };
            }
          } catch (err) {
            await session.abortTransaction();
            console.error(`[${new Date().toISOString()}] Error refunding bet in getBetHistory:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              error: err.message,
            });
            return {
              ...bet,
              status: 'pending',
              roundStatus: 'not_found',
              error: 'Failed to process bet refund',
            };
          } finally {
            session.endSession();
          }
        }

        const now = Date.now();
        if (round.expiresAt < new Date(now)) {
          const session = await Bet.startSession();
          session.startTransaction();
          try {
            const { resultNumber, resultColor } = await calculateRoundResult(bet.period);

            // Update Round model with results
            await Round.updateOne(
              { period: bet.period },
              {
                resultNumber,
                resultColor,
                updatedAt: new Date(),
                isManuallySet: false,
              },
              { session }
            );

            let won = false;
            let payout = 0;

            if (bet.type === 'color') {
              won = bet.value === resultColor;
              payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
            } else if (bet.type === 'number') {
              won = parseInt(bet.value) === resultNumber;
              payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
            }

            await Bet.updateOne(
              { _id: bet._id },
              {
                result: bet.type === 'color' ? resultColor : resultNumber.toString(),
                won,
                payout,
                status: 'finalized',
                updatedAt: new Date(),
              },
              { session }
            );

            const user = await User.findById(bet.userId).session(session);
            if (!user) {
              throw new Error('User not found');
            }

            const newBalance = user.balance + payout;
            await User.findByIdAndUpdate(
              bet.userId,
              { $set: { balance: newBalance, updatedAt: new Date() } },
              { session }
            );

            await session.commitTransaction();
            console.log(`[${new Date().toISOString()}] Finalized bet in getBetHistory:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              won,
              payout,
              newBalance,
            });

            return {
              ...bet,
              result: bet.type === 'color' ? resultColor : resultNumber.toString(),
              won,
              payout,
              status: 'finalized',
              newBalance,
            };
          } catch (err) {
            await session.abortTransaction();
            console.error(`[${new Date().toISOString()}] Error finalizing bet in getBetHistory:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              error: err.message,
            });
            return { ...bet, status: 'pending', roundStatus: 'error_finalizing' };
          } finally {
            session.endSession();
          }
        }

        return {
          ...bet,
          status: 'pending',
          roundStatus: 'active',
          roundExpiresAt: round.expiresAt,
        };
      })
    );

    res.json(processedBets);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getBetHistory:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getPendingBets = async (req, res) => {
  try {
    const bets = await Bet.find({
      userId: req.user.id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .lean();

    const processedBets = await Promise.all(
      bets.map(async (bet) => {
        if (!bet.type || !bet.value || !bet.amount || !bet.period) {
          await Bet.updateOne(
            { _id: bet._id },
            { status: 'invalid', updatedAt: new Date(), error: 'Missing required fields' }
          );
          return { ...bet, status: 'invalid', error: 'Missing required fields' };
        }

        const round = await Round.findOne({ period: bet.period }).lean();
        if (!round) {
          const session = await Bet.startSession();
          session.startTransaction();
          try {
            const user = await User.findById(bet.userId).session(session);
            if (user) {
              const newBalance = user.balance + bet.amount;
              await User.findByIdAndUpdate(
                bet.userId,
                { $set: { balance: newBalance, updatedAt: new Date() } },
                { session }
              );
              await Bet.updateOne(
                { _id: bet._id },
                {
                  status: 'invalid',
                  updatedAt: new Date(),
                  error: 'Round data missing, bet refunded',
                },
                { session }
              );
              await session.commitTransaction();
              console.log(`[${new Date().toISOString()}] Refunded bet in getPendingBets:`, {
                betId: bet._id,
                userId: bet.userId,
                period: bet.period,
                refundedAmount: bet.amount,
                newBalance,
              });
              return {
                ...bet,
                status: 'invalid',
                roundStatus: 'not_found',
                error: 'Round data missing, bet refunded',
                newBalance,
              };
            } else {
              await Bet.updateOne(
                { _id: bet._id },
                {
                  status: 'invalid',
                  updatedAt: new Date(),
                  error: 'Round data missing, user not found',
                },
                { session }
              );
              await session.commitTransaction();
              console.warn(`[${new Date().toISOString()}] Marked bet invalid (user not found) in getPendingBets:`, {
                betId: bet._id,
                userId: bet.userId,
                period: bet.period,
              });
              return {
                ...bet,
                status: 'invalid',
                roundStatus: 'not_found',
                error: 'Round data missing, user not found',
              };
            }
          } catch (err) {
            await session.abortTransaction();
            console.error(`[${new Date().toISOString()}] Error refunding bet in getPendingBets:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              error: err.message,
            });
            return {
              ...bet,
              status: 'pending',
              roundStatus: 'not_found',
              error: 'Failed to process bet refund',
            };
          } finally {
            session.endSession();
          }
        }

        if (round.expiresAt < new Date()) {
          const session = await Bet.startSession();
          session.startTransaction();
          try {
            const { resultNumber, resultColor } = await calculateRoundResult(bet.period);

            // Update Round model with results
            await Round.updateOne(
              { period: bet.period },
              {
                resultNumber,
                resultColor,
                updatedAt: new Date(),
                isManuallySet: false,
              },
              { session }
            );

            let won = false;
            let payout = 0;

            if (bet.type === 'color') {
              won = bet.value === resultColor;
              payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
            } else if (bet.type === 'number') {
              won = parseInt(bet.value) === resultNumber;
              payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
            }

            await Bet.updateOne(
              { _id: bet._id },
              {
                result: bet.type === 'color' ? resultColor : resultNumber.toString(),
                won,
                payout,
                status: 'finalized',
                updatedAt: new Date(),
              },
              { session }
            );

            const user = await User.findById(bet.userId).session(session);
            if (!user) {
              throw new Error('User not found');
            }

            const newBalance = user.balance + payout;
            await User.findByIdAndUpdate(
              bet.userId,
              { $set: { balance: newBalance, updatedAt: new Date() } },
              { session }
            );

            await session.commitTransaction();
            console.log(`[${new Date().toISOString()}] Finalized bet in getPendingBets:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              won,
              payout,
              newBalance,
            });

            return {
              ...bet,
              result: bet.type === 'color' ? resultColor : resultNumber.toString(),
              won,
              payout,
              status: 'finalized',
              newBalance,
            };
          } catch (err) {
            await session.abortTransaction();
            console.error(`[${new Date().toISOString()}] Error finalizing bet in getPendingBets:`, {
              betId: bet._id,
              userId: bet.userId,
              period: bet.period,
              error: err.message,
            });
            return { ...bet, status: 'pending', roundStatus: 'error_finalizing' };
          } finally {
            session.endSession();
          }
        }

        return {
          ...bet,
          status: 'pending',
          roundStatus: 'active',
          roundExpiresAt: round.expiresAt,
        };
      })
    );

    res.json(processedBets);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getPendingBets:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBetStats = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id });

    const finalizedBets = bets.filter((bet) => bet.status === 'finalized');
    const pendingBets = bets.filter((bet) => bet.status === 'pending');

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
        { $set: { balance: newBalance, updatedAt: new Date() } },
        { session }
      );

      const bet = new Bet({
        userId: req.user.id,
        period,
        type,
        value,
        amount,
        clientSeed,
        status: 'pending',
        createdAt: new Date(),
      });
      await bet.save({ session });

      await session.commitTransaction();
      console.log(`[${new Date().toISOString()}] Bet placed:`, {
        betId: bet._id,
        userId: req.user.id,
        period,
        amount,
        newBalance,
      });
      res.json({ bet, balance: newBalance });
    } catch (err) {
      await session.abortTransaction();
      console.error(`[${new Date().toISOString()}] Error in placeBet:`, {
        userId: req.user.id,
        period,
        error: err.message,
      });
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in placeBet:`, err.message, err.stack);
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

    if (bet.status === 'finalized') {
      console.log(`[${new Date().toISOString()}] Returning existing bet result:`, {
        betId: bet._id,
        won: bet.won,
        payout: bet.payout,
      });
      const user = await User.findById(userId).select('balance');
      return res.json({ bet, balance: user ? user.balance : null });
    }

    const round = await Round.findOne({ period });
    if (!round) {
      const session = await Bet.startSession();
      session.startTransaction();
      try {
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        const newBalance = user.balance + bet.amount;
        await User.findByIdAndUpdate(
          userId,
          { $set: { balance: newBalance, updatedAt: new Date() } },
          { session }
        );

        await Bet.updateOne(
          { _id: bet._id },
          {
            status: 'invalid',
            updatedAt: new Date(),
            error: 'Round data missing, bet refunded',
          },
          { session }
        );

        await session.commitTransaction();
        console.log(`[${new Date().toISOString()}] Refunded bet in getBetResult:`, {
          betId: bet._id,
          userId,
          period,
          refundedAmount: bet.amount,
          newBalance,
        });
        return res.json({
          bet: {
            ...bet.toObject(),
            status: 'invalid',
            error: 'Round data missing, bet refunded',
          },
          balance: newBalance,
        });
      } catch (err) {
        await session.abortTransaction();
        console.error(`[${new Date().toISOString()}] Error refunding bet in getBetResult:`, {
          betId: bet._id,
          userId,
          period,
          error: err.message,
        });
        return res.status(500).json({ error: 'Server error', details: err.message });
      } finally {
        session.endSession();
      }
    }

    if (round.expiresAt < new Date()) {
      const session = await Bet.startSession();
      session.startTransaction();
      try {
        const { resultNumber, resultColor } = await calculateRoundResult(period);

        // Update Round model with results
        await Round.updateOne(
          { period },
          {
            resultNumber,
            resultColor,
            updatedAt: new Date(),
            isManuallySet: false,
          },
          { session }
        );

        let won = false;
        let payout = 0;

        if (bet.type === 'color') {
          won = bet.value === resultColor;
          payout = won ? bet.amount * PAYOUT_MULTIPLIERS.color : 0;
        } else if (bet.type === 'number') {
          won = parseInt(bet.value) === resultNumber;
          payout = won ? bet.amount * PAYOUT_MULTIPLIERS.number : 0;
        }

        console.log(`[${new Date().toISOString()}] Bet result calculated:`, {
          betId: bet._id,
          userId,
          period,
          won,
          payout,
          resultNumber,
          resultColor,
        });

        await Bet.updateOne(
          { _id: bet._id },
          {
            result: bet.type === 'color' ? resultColor : resultNumber.toString(),
            won,
            payout,
            status: 'finalized',
            updatedAt: new Date(),
          },
          { session }
        );

        const updatedBet = await Bet.findById(bet._id).session(session);
        if (!updatedBet) {
          throw new Error('Bet not found after update');
        }

        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        const newBalance = user.balance + payout;
        await User.findByIdAndUpdate(
          userId,
          { $set: { balance: newBalance, updatedAt: new Date() } },
          { session }
        );

        await session.commitTransaction();
        console.log(`[${new Date().toISOString()}] Finalized bet and updated balance:`, {
          betId: bet._id,
          userId,
          period,
          won,
          payout,
          newBalance,
        });

        res.json({ bet: updatedBet, balance: newBalance });
      } catch (err) {
        await session.abortTransaction();
        console.error(`[${new Date().toISOString()}] Error finalizing bet in getBetResult:`, {
          betId: bet._id,
          userId,
          period,
          error: err.message,
        });
        return res.status(500).json({ error: 'Server error', details: err.message });
      } finally {
        session.endSession();
      }
    } else {
      return res.json({
        bet,
        balance: (await User.findById(userId).select('balance')).balance,
        roundStatus: 'active',
        roundExpiresAt: round.expiresAt,
      });
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getBetResult:`, err.message, err.stack);
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
      result: round.resultNumber !== null && round.resultColor !== null
        ? { resultNumber: round.resultNumber, resultColor: round.resultColor }
        : null,
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
    const roundDuration = 120 * 1000;
    const now = Date.now();
    const roundsToGenerate = 24 * 60 * 60 * 1000 / roundDuration;
    const generatedRounds = [];

    for (let i = 0; i < roundsToGenerate; i++) {
      const roundStart = Math.floor((now + i * roundDuration) / roundDuration) * roundDuration;
      const period = `round-${roundStart}`;
      const round = await createRound(period);
      generatedRounds.push(period);
    }

    console.log(`[${new Date().toISOString()}] Manual pre-generation triggered:`, {
      count: generatedRounds.length,
    });
    res.json({ count: generatedRounds.length, periods: generatedRounds });
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

    if (resultNumber !== null && (isNaN(resultNumber) || resultNumber < 0 || resultNumber > 9)) {
      console.error(`[${new Date().toISOString()}] Invalid resultNumber: ${resultNumber}`);
      return res.status(400).json({ error: 'Invalid resultNumber, must be 0–9' });
    }

    if (resultColor !== null && !['Green', 'Red'].includes(resultColor)) {
      console.error(`[${new Date().toISOString()}] Invalid resultColor: ${resultColor}`);
      return res.status(400).json({ error: 'Invalid resultColor, must be Green or Red' });
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
    console.log(`[${new Date().toISOString()}] Manually set round outcome:`, { period, resultNumber, resultColor });
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

    if (round.expiresAt < new Date() && (round.resultNumber === null || round.resultColor === null)) {
      const { resultNumber, resultColor } = await calculateRoundResult(period);
      await Round.updateOne(
        { period },
        {
          resultNumber,
          resultColor,
          updatedAt: new Date(),
          isManuallySet: false,
        }
      );
      round.resultNumber = resultNumber;
      round.resultColor = resultColor;
    }

    res.json({
      period: round.period,
      result: {
        number: round.resultNumber !== null ? round.resultNumber.toString() : 'Pending',
        color: round.resultColor || 'Pending',
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

    const formattedRounds = await Promise.all(
      rounds.map(async (round) => {
        if (round.expiresAt < new Date() && (round.resultNumber === null || round.resultColor === null)) {
          const { resultNumber, resultColor } = await calculateRoundResult(round.period);
          await Round.updateOne(
            { period: round.period },
            {
              resultNumber,
              resultColor,
              updatedAt: new Date(),
              isManuallySet: false,
            }
          );
          round.resultNumber = resultNumber;
          round.resultColor = resultColor;
        }
        return {
          period: round.period,
          result: {
            color: round.resultColor || 'Pending',
            number: round.resultNumber !== null ? round.resultNumber.toString() : 'Pending',
          },
        };
      })
    );

    console.log(`[${new Date().toISOString()}] Fetched all rounds:`, { count: formattedRounds.length });
    res.json(formattedRounds);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getAllRounds:`, err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getRecentRounds = async (req, res) => {
  try {
    const now = new Date();
    const rounds = await Round.find({
      expiresAt: { $lt: now },
    })
      .sort({ expiresAt: -1 })
      .limit(10)
      .select('period resultNumber resultColor expiresAt')
      .lean();

    const formattedRounds = await Promise.all(
      rounds.map(async (round) => {
        if (round.resultNumber === null || round.resultColor === null) {
          const { resultNumber, resultColor } = await calculateRoundResult(round.period);
          await Round.updateOne(
            { period: round.period },
            {
              resultNumber,
              resultColor,
              updatedAt: new Date(),
              isManuallySet: false,
            }
          );
          round.resultNumber = resultNumber;
          round.resultColor = resultColor;
        }
        return {
          period: round.period,
          result: {
            color: round.resultColor || 'Pending',
            number: round.resultNumber !== null ? round.resultNumber.toString() : 'Pending',
          },
          expiresAt: round.expiresAt,
        };
      })
    );

    console.log(`[${new Date().toISOString()}] Fetched recent past rounds:`, { count: formattedRounds.length });
    res.json(formattedRounds);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getRecentRounds:`, err.message, err.stack);
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
