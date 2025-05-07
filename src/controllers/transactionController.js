const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const nowpaymentsConfig = require('../config/nowpayments');

// Initiate Crypto Deposit
const initiateCryptoDeposit = async (req, res) => {
  const { amount, cryptoCurrency } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  if (!cryptoCurrency || !['BTC', 'ETH', 'USDT'].includes(cryptoCurrency)) {
    return res.status(400).json({ error: 'Unsupported cryptocurrency' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const response = await axios.post(
      `${nowpaymentsConfig.baseUrl}/payment`,
      {
        price_amount: amount,
        price_currency: 'USD',
        pay_currency: cryptoCurrency.toLowerCase(),
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
          cryptoCurrency,
          paymentId: payment_id,
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
    console.error('Crypto deposit error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate crypto deposit' });
  } finally {
    session.endSession();
  }
};

// Initiate Crypto Withdrawal
const initiateCryptoWithdrawal = async (req, res) => {
  const { amount, cryptoCurrency, walletAddress } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  if (!cryptoCurrency || !['BTC', 'ETH', 'USDT'].includes(cryptoCurrency)) {
    return res.status(400).json({ error: 'Unsupported cryptocurrency' });
  }
  if (!walletAddress || !/^[a-zA-Z0-9]{26,42}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (amount > user.balance) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const response = await axios.post(
      `${nowpaymentsConfig.baseUrl}/payout`,
      {
        amount,
        currency: cryptoCurrency.toLowerCase(),
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
          cryptoCurrency,
          paymentId: payout_id,
          walletAddress,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.json({ message: `Initiated withdrawal of ${amount} ${cryptoCurrency} to ${walletAddress}`, balance: updatedUser.balance });
  } catch (err) {
    await session.abortTransaction();
    console.error('Crypto withdrawal error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate crypto withdrawal' });
  } finally {
    session.endSession();
  }
};

// Webhook for Crypto Payments and Withdrawals
const handleWebhook = async (req, res) => {
  const { payment_id, payment_status, payout_id, payout_status, order_id } = req.body;

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
        user.balance += transaction.amount;
        await user.save({ session });
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
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  } finally {
    session.endSession();
  }
};

module.exports = { initiateCryptoDeposit, initiateCryptoWithdrawal, handleWebhook };
