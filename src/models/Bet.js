const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  type: { type: String, enum: ['color', 'number'], required: true },
  value: { type: String, required: true },
  amount: { type: Number, required: true },
  clientSeed: { type: String },
  color: { type: String, enum: ['Green', 'Red'] },
  exactMultiplier: { type: Number },
  result: { type: String },
  won: { type: Boolean },
  payout: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Bet', betSchema);
