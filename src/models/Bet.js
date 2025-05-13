const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
  amount: { type: Number, required: true },
  clientSeed: { type: String },
  color: { type: String },
  exactMultiplier: { type: Number },
  result: { type: String },
  won: { type: Boolean },
  payout: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

