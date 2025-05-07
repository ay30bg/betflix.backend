const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const deposit = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  if (amount < 3) {
    return res.status(400).json({ error: 'Minimum deposit amount is $3' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: amount }, updatedAt: Date.now() },
      { new: true, select: 'balance', session }
    );

    await Transaction.create(
      [{
        userId: req.user.id,
        amount,
        type: 'DEPOSIT',
        status: 'COMPLETED',
      }],
      { session }
    );

    await session.commitTransaction();
    res.json({ message: `Deposited $${amount.toFixed(2)} successfully`, balance: user.balance });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Failed to process deposit' });
  } finally {
    session.endSession();
  }
};

const withdraw = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user.id).session(session);

    if (amount > user.balance) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: -amount }, updatedAt: Date.now() },
      { new: true, select: 'balance', session }
    );

    await Transaction.create(
      [{
        userId: req.user.id,
        amount,
        type: 'WITHDRAW',
        status: 'COMPLETED',
      }],
      { session }
    );

    await session.commitTransaction();
    res.json({ message: `Withdrew $${amount.toFixed(2)} successfully`, balance: updatedUser.balance });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Failed to process withdrawal' });
  } finally {
    session.endSession();
  }
};

module.exports = { deposit, withdraw };