const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  period: { type: String, required: true, unique: true },
  resultNumber: { type: Number, min: 0, max: 9 },
  resultColor: { type: String, enum: ['Green', 'Red'] },
  serverSeed: { type: String },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  isManuallySet: { type: Boolean, default: false }, // New field
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Round', RoundSchema);

// // backend/models/Round.js
// const mongoose = require('mongoose');

// const roundSchema = new mongoose.Schema({
//   roundId: { type: String, required: true, unique: true }, // e.g., "1747381920000"
//   startTime: { type: Date, required: true }, // When the round starts
//   endTime: { type: Date, required: true }, // When the round ends
//   status: { type: String, enum: ['open', 'closed', 'pending'], default: 'open' },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Round', roundSchema);
