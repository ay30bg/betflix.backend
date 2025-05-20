// const mongoose = require('mongoose');
// const User = require('../models/User');
// const Transaction = require('../models/Transaction');
// const axios = require('axios');
// const nowpaymentsConfig = require('../config/nowpayments');

// // Initiate Crypto Deposit
// const initiateCryptoDeposit = async (req, res) => {
//   const { amount, cryptoCurrency, network } = req.body;
//   const userId = req.user.id;

//   console.log('Deposit request:', { amount, cryptoCurrency, network, userId });

//   if (!amount || amount <= 0) {
//     return res.status(400).json({ error: 'Invalid deposit amount' });
//   }
//   const normalizedCrypto = cryptoCurrency?.toUpperCase();
//   if (!normalizedCrypto || !['BTC', 'ETH', 'USDT'].includes(normalizedCrypto)) {
//     return res.status(400).json({ error: 'Unsupported cryptocurrency' });
//   }
//   if (normalizedCrypto === 'USDT' && !['BEP20', 'TRC20', 'TON'].includes(network)) {
//     return res.status(400).json({ error: 'Invalid or missing USDT network (must be BEP20, TRC20, or TON)' });
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Map USDT to network-specific currency code
//     let payCurrency = normalizedCrypto.toLowerCase();
//     if (normalizedCrypto === 'USDT') {
//       if (network === 'TRC20') payCurrency = 'usdttrc20';
//       else if (network === 'BEP20') payCurrency = 'usdtbsc';
//       else if (network === 'TON') payCurrency = 'usdtton';
//     }
//     console.log('Mapped payCurrency:', payCurrency);

//     const response = await axios.post(
//       `${nowpaymentsConfig.baseUrl}/payment`,
//       {
//         price_amount: amount,
//         price_currency: 'USD',
//         pay_currency: payCurrency,
//         order_id: `${userId}_${Date.now()}`,
//         order_description: `Crypto deposit for user ${userId}`,
//         ipn_callback_url: `${process.env.BASE_URL}/api/transactions/webhook`,
//         success_url: `${process.env.REACT_APP_FRONTEND_URL}/profile`,
//         cancel_url: `${process.env.REACT_APP_FRONTEND_URL}/profile`,
//       },
//       {
//         headers: {
//           'x-api-key': nowpaymentsConfig.apiKey,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const { payment_id, pay_address, pay_amount } = response.data;

//     await Transaction.create(
//       [
//         {
//           userId,
//           amount,
//           type: 'crypto-deposit',
//           status: 'pending',
//           cryptoCurrency: normalizedCrypto,
//           paymentId: payment_id,
//           network,
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     res.json({
//       paymentUrl: response.data.payment_url || `https://nowpayments.io/payment/?pid=${payment_id}`,
//       payAddress: pay_address,
//       payAmount: pay_amount,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error('Crypto deposit error:', JSON.stringify(err.response?.data, null, 2));
//     const errorMessage = err.response?.data?.message || 'Failed to initiate crypto deposit';
//     res.status(err.response?.status || 500).json({
//       error: errorMessage,
//       details: err.response?.data || err.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Initiate Crypto Withdrawal
// const initiateCryptoWithdrawal = async (req, res) => {
//   const { amount, cryptoCurrency, walletAddress, network } = req.body;
//   const userId = req.user.id;

//   console.log('Withdrawal request:', { amount, cryptoCurrency, walletAddress, network, userId });

//   if (!amount || amount <= 0) {
//     return res.status(400).json({ error: 'Invalid withdrawal amount' });
//   }
//   const normalizedCrypto = cryptoCurrency?.toUpperCase();
//   if (!normalizedCrypto || !['BTC', 'ETH', 'USDT'].includes(normalizedCrypto)) {
//     return res.status(400).json({ error: 'Unsupported cryptocurrency' });
//   }
//   if (normalizedCrypto === 'USDT' && !['BEP20', 'TRC20', 'TON'].includes(network)) {
//     return res.status(400).json({ error: 'Invalid or missing USDT network (must be BEP20, TRC20, or TON)' });
//   }
//   if (!walletAddress || !/^[a-zA-Z0-9]{26,48}$/.test(walletAddress)) {
//     return res.status(400).json({ error: 'Invalid wallet address (26-48 characters)' });
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const user = await User.findById(userId).session(session);
//     if (amount > user.balance) {
//       await session.abortTransaction();
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     const payCurrency = normalizedCrypto === 'USDT'
//       ? (network === 'TRC20' ? 'usdttrc20' : network === 'BEP20' ? 'usdtbsc' : 'usdtton')
//       : normalizedCrypto.toLowerCase();
//     console.log('Mapped payCurrency:', payCurrency);

//     const response = await axios.post(
//       `${nowpaymentsConfig.baseUrl}/payout`,
//       {
//         amount,
//         currency: payCurrency,
//         address: walletAddress,
//         order_id: `${userId}_${Date.now()}`,
//         ipn_callback_url: `${process.env.BASE_URL}/api/transactions/webhook`,
//       },
//       {
//         headers: {
//           'x-api-key': nowpaymentsConfig.apiKey,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const { payout_id } = response.data;

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $inc: { balance: -amount }, updatedAt: Date.now() },
//       { new: true, select: 'balance', session }
//     );

//     await Transaction.create(
//       [
//         {
//           userId,
//           amount,
//           type: 'crypto-withdrawal',
//           status: 'pending',
//           cryptoCurrency: normalizedCrypto,
//           paymentId: payout_id,
//           walletAddress,
//           network,
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     res.json({
//       message: `Initiated withdrawal of ${amount} ${normalizedCrypto} to ${walletAddress}`,
//       balance: updatedUser.balance,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error('Crypto withdrawal error:', JSON.stringify(err.response?.data, null, 2));
//     const errorMessage = err.response?.data?.message || 'Failed to initiate crypto withdrawal';
//     res.status(err.response?.status || 500).json({
//       error: errorMessage,
//       details: err.response?.data || err.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Webhook for Crypto Payments and Withdrawals
// const handleWebhook = async (req, res) => {
//   const { payment_id, payment_status, payout_id, payout_status, order_id } = req.body;

//   console.log('Webhook received:', { payment_id, payment_status, payout_id, payout_status, order_id });

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const transaction = await Transaction.findOne({
//       paymentId: payment_id || payout_id,
//     }).session(session);
//     if (!transaction) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: 'Transaction not found' });
//     }

//     const status = payment_status || payout_status;
//     if (status === 'finished' || status === 'confirmed') {
//       transaction.status = 'completed';
//       if (transaction.type === 'crypto-deposit') {
//         const user = await User.findById(transaction.userId).session(session);
//         user.balance += transaction.amount;
//         await user.save({ session });
//       }
//       await transaction.save({ session });
//     } else if (status === 'failed' || status === 'expired') {
//       transaction.status = 'failed';
//       await transaction.save({ session });
//     }

//     await session.commitTransaction();
//     res.status(200).json({ message: 'Webhook processed' });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error('Webhook error:', JSON.stringify(err, null, 2));
//     res.status(500).json({ error: 'Webhook processing failed', details: err.message });
//   } finally {
//     session.endSession();
//   }
// };

// module.exports = { initiateCryptoDeposit, initiateCryptoWithdrawal, handleWebhook };

// controllers/transactionsController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const nowpaymentsConfig = require('../config/nowpayments');

// Initiate Crypto Deposit
const initiateCryptoDeposit = async (req, res) => {
  const { amount, cryptoCurrency, network } = req.body;
  const userId = req.user.userId; // Changed from req.user.id

  console.log('Deposit request:', { amount, cryptoCurrency, network, userId });

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  const normalizedCrypto = cryptoCurrency?.toUpperCase();
  if (!normalizedCrypto || !['BTC', 'ETH', 'USDT'].includes(normalizedCrypto)) {
    return res.status(400).json({ error: 'Unsupported cryptocurrency' });
  }
  if (normalizedCrypto === 'USDT' && !['BEP20', 'TRC20', 'TON'].includes(network)) {
    return res.status(400).json({ error: 'Invalid or missing USDT network (must be BEP20, TRC20, or TON)' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let payCurrency = normalizedCrypto.toLowerCase();
    if (normalizedCrypto === 'USDT') {
      if (network === 'TRC20') payCurrency = 'usdttrc20';
      else if (network === 'BEP20') payCurrency = 'usdtbsc';
      else if (network === 'TON') payCurrency = 'usdtton';
    }
    console.log('Mapped payCurrency:', payCurrency);

    const response = await axios.post(
      `${nowpaymentsConfig.baseUrl}/payment`,
      {
        price_amount: amount,
        price_currency: 'USD',
        pay_currency: payCurrency,
        order_id: `${userId}_${Date.now()}`,
        order_description: `Crypto deposit for user ${userId}`,
        ipn_callback_url: `${process.env.BASE_URL}/api/transactions/webhook`,
        success_url: `${process.env.REACT_APP_FRONTEND_URL}/profile`,
        cancel_url: `${process.env.REACT_APP_FRONTEND_URL}/profile`,
      },
      {
        headers: {
          'x-api-key': nowpaymentsConfig.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const { payment_id, pay_address, pay_amount } = response.data;

    await Transaction.create(
      [
        {
          userId,
          amount,
          type: 'crypto-deposit',
          status: 'pending',
          cryptoCurrency: normalizedCrypto,
          paymentId: payment_id,
          network,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.json({
      paymentUrl: response.data.payment_url || `https://nowpayments.io/payment/?pid=${payment_id}`,
      payAddress: pay_address,
      payAmount: pay_amount,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Crypto deposit error:', JSON.stringify(err.response?.data, null, 2));
    const errorMessage = err.response?.data?.message || 'Failed to initiate crypto deposit';
    res.status(err.response?.status || 500).json({
      error: errorMessage,
      details: err.response?.data || err.message,
    });
  } finally {
    session.endSession();
  }
};

// Initiate Crypto Withdrawal
const initiateCryptoWithdrawal = async (req, res) => {
  const { amount, cryptoCurrency, walletAddress, network } = req.body;
  const userId = req.user.userId; // Changed from req.user.id

  console.log('Withdrawal request:', { amount, cryptoCurrency, walletAddress, network, userId });

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  const normalizedCrypto = cryptoCurrency?.toUpperCase();
  if (!normalizedCrypto || !['BTC', 'ETH', 'USDT'].includes(normalizedCrypto)) {
    return res.status(400).json({ error: 'Unsupported cryptocurrency' });
  }
  if (normalizedCrypto === 'USDT' && !['BEP20', 'TRC20', 'TON'].includes(network)) {
    return res.status(400).json({ error: 'Invalid or missing USDT network (must be BEP20, TRC20, or TON)' });
  }
  if (!walletAddress || !/^[a-zA-Z0-9]{26,48}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address (26-48 characters)' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (amount > user.balance) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const payCurrency = normalizedCrypto === 'USDT'
      ? (network === 'TRC20' ? 'usdttrc20' : network === 'BEP20' ? 'usdtbsc' : 'usdtton')
      : normalizedCrypto.toLowerCase();
    console.log('Mapped payCurrency:', payCurrency);

    const response = await axios.post(
      `${nowpaymentsConfig.baseUrl}/payout`,
      {
        amount,
        currency: payCurrency,
        address: walletAddress,
        order_id: `${userId}_${Date.now()}`,
        ipn_callback_url: `${process.env.BASE_URL}/api/transactions/webhook`,
      },
      {
        headers: {
          'x-api-key': nowpaymentsConfig.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const { payout_id } = response.data;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: -amount }, updatedAt: Date.now() },
      { new: true, select: 'balance', session }
    );

    await Transaction.create(
      [
        {
          userId,
          amount,
          type: 'crypto-withdrawal',
          status: 'pending',
          cryptoCurrency: normalizedCrypto,
          paymentId: payout_id,
          walletAddress,
          network,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.json({
      message: `Initiated withdrawal of ${amount} ${normalizedCrypto} to ${walletAddress}`,
      balance: updatedUser.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Crypto withdrawal error:', JSON.stringify(err.response?.data, null, 2));
    const errorMessage = err.response?.data?.message || 'Failed to initiate crypto withdrawal';
    res.status(err.response?.status || 500).json({
      error: errorMessage,
      details: err.response?.data || err.message,
    });
  } finally {
    session.endSession();
  }
};

// Webhook for Crypto Payments and Withdrawals
const handleWebhook = async (req, res) => {
  const { payment_id, payment_status, payout_id, payout_status, order_id } = req.body;

  console.log('Webhook received:', { payment_id, payment_status, payout_id, payout_status, order_id });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await Transaction.findOne({
      paymentId: payment_id || payout_id,
    }).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const status = payment_status || payout_status;
    if (status === 'finished' || status === 'confirmed') {
      transaction.status = 'completed';
      if (transaction.type === 'crypto-deposit') {
        const user = await User.findById(transaction.userId).session(session);
        if (!user) {
          await session.abortTransaction();
          return res.status(404).json({ error: 'User not found' });
        }
        user.balance += transaction.amount;
        await user.save({ session });

        // Award referral bonus if user was referred
        if (user.referredBy) {
          const depositCount = await Transaction.countDocuments({
            userId: user._id,
            type: 'crypto-deposit',
            status: 'completed',
          });
          const isFirstDeposit = depositCount === 1; // Count includes this transaction
          const bonusPercentage = isFirstDeposit ? 0.3 : 0.1;
          const bonus = transaction.amount * bonusPercentage;

          const referrerReferral = await Referral.findOne({ referrerId: user.referredBy }).session(session);
          if (referrerReferral) {
            const referredUserEntry = referrerReferral.referredUsers.find(
              (entry) => entry.userId.toString() === user._id.toString()
            );
            if (referredUserEntry) {
              referredUserEntry.bonusEarned = (referredUserEntry.bonusEarned || 0) + bonus;
              referrerReferral.totalBonus = (referrerReferral.totalBonus || 0) + bonus;
              referrerReferral.availableBonus = (referrerReferral.availableBonus || 0) + bonus;
              await referrerReferral.save({ session });
              console.log('Referral bonus awarded:', {
                referrerId: user.referredBy,
                bonus,
                isFirstDeposit,
                referredUserId: user._id,
              });
            }
          }
        }
      }
      await transaction.save({ session });
    } else if (status === 'failed' || status === 'expired') {
      transaction.status = 'failed';
      await transaction.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({ message: 'Webhook processed' });
  } catch (err) {
    await session.abortTransaction();
    console.error('Webhook error:', JSON.stringify(err, null, 2));
    res.status(500).json({ error: 'Webhook processing failed', details: err.message });
  } finally {
    session.endSession();
  }
};

module.exports = { initiateCryptoDeposit, initiateCryptoWithdrawal, handleWebhook };
