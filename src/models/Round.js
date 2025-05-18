const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  period: { type: String, required: true, unique: true },
  resultNumber: { type: Number, min: 0, max: 9 },
  resultColor: { type: String, enum: ['Green', 'Red'] },
  serverSeed: { type: String },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  isManuallySet: { type: Boolean, default: false },
  updatedAt: { type: Date },
});

// TTL index to delete rounds 3 minutes after expiresAt
RoundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 180 });

// Index for efficient queries
RoundSchema.index({ period: 1 });

module.exports = mongoose.model('Round', RoundSchema);
