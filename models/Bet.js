const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  won: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for faster queries
betSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Bet', betSchema);