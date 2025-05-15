// const mongoose = require('mongoose');

// const roundSchema = new mongoose.Schema({
//   period: { type: String, required: true, unique: true }, // Unique identifier for the round
//   resultNumber: { type: Number, min: 0, max: 9 }, // Outcome (0-9)
//   resultColor: { type: String, enum: ['Green', 'Red'] }, // Derived from resultNumber
//   createdAt: { type: Date, default: Date.now },
//   expiresAt: { type: Date, required: true }, // When the round ends
//   serverSeed: { type: String }, // For provably fair verification
// });

// // Add TTL index to automatically remove old rounds
// roundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// module.exports = mongoose.model('Round', roundSchema);

const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  period: { type: String, required: true, unique: true }, // Unique identifier for the round
  resultNumber: { type: Number, min: 0, max: 9 }, // Outcome (0-9)
  resultColor: { type: String, enum: ['Green', 'Red'] }, // Derived from resultNumber
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // When the round ends
  serverSeed: { type: String }, // For provably fair verification
});

Remove the TTL index
roundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 10800 }); 

module.exports = mongoose.model('Round', roundSchema);
