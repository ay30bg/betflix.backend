const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  cryptoCurrency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH', 'USDT'],
  },
  walletAddress: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    enum: ['BEP20', 'TRC20', 'TON', null],
  },
  withdrawalPassword: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
