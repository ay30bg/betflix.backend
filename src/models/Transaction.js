const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'crypto-deposit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  currency: { type: String, default: 'USD' }, // For fiat; crypto uses cryptoCurrency
  cryptoCurrency: { type: String }, // e.g., BTC, ETH, USDT
  paymentId: { type: String }, // NOWPayments payment ID
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
