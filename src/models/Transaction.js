const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['crypto-deposit', 'crypto-withdrawal'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  cryptoCurrency: { type: String, required: true }, // e.g., BTC, ETH, USDT
  paymentId: { type: String }, // NOWPayments payment/payout ID
  walletAddress: { type: String }, // For withdrawals
  network: { type: String }, // For USDT network (e.g., ERC20, TRC20)
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
