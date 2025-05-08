const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true }, // References Round.period (e.g., round-1697059200000)
  type: { type: String, required: true }, // 'color' or 'number'
  value: { type: String, required: true }, // Bet value (e.g., 'Green' or number)
  amount: { type: Number, required: true }, // Bet amount
  result: { type: String, required: true }, // Result (e.g., 'Green' or number)
  won: { type: Boolean, required: true }, // Whether the bet was won
  payout: { type: Number, required: true }, // Payout amount (positive or negative)
  createdAt: { type: Date, default: Date.now },
});

// Index for faster queries
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ userId: 1, period: 1 }, { unique: true }); // Ensure unique period per user

module.exports = mongoose.model('Bet', betSchema);
