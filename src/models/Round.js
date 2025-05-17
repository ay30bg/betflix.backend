// const mongoose = require('mongoose');

// const RoundSchema = new mongoose.Schema({
//   period: { type: String, required: true, unique: true },
//   resultNumber: { type: Number, min: 0, max: 9 },
//   resultColor: { type: String, enum: ['Green', 'Red'] },
//   serverSeed: { type: String },
//   createdAt: { type: Date, required: true },
//   expiresAt: { type: Date, required: true },
//   isManuallySet: { type: Boolean, default: false }, // New field
//   updatedAt: { type: Date },
// });

// module.exports = mongoose.model('Round', RoundSchema);

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

// Add TTL index on expiresAt with a 10-second delay to account for grace period
RoundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 10 });

module.exports = mongoose.model('Round', RoundSchema);
