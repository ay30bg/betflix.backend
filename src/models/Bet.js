// const mongoose = require('mongoose');

// const betSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   period: { type: String, required: true },
//   type: { type: String, required: true },
//   value: { type: String, required: true },
//   amount: { type: Number, required: true },
//   clientSeed: { type: String },
//   color: { type: String },
//   exactMultiplier: { type: Number },
//   result: { type: String },
//   won: { type: Boolean },
//   payout: { type: Number },
//   createdAt: { type: Date, default: Date.now },
// });

const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  type: { type: String, enum: ['color', 'number'], required: true },
  value: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  clientSeed: { type: String, required: true, maxlength: 100 },
  color: { type: String, enum: ['Green', 'Red'], required: true },
  exactMultiplier: { type: Number, min: 0 },
  result: { type: String },
  won: { type: Boolean },
  payout: { type: Number, min: 0 },
  status: { type: String, enum: ['pending', 'processed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
betSchema.index({ userId: 1, period: 1 }); // Removed unique constraint
betSchema.index({ period: 1 });
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ status: 1 });

// Update timestamp on save
betSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bet', betSchema);

// betSchema.index({ userId: 1, period: 1 }, { unique: true });
// betSchema.index({ userId: 1, createdAt: -1 });

// module.exports = mongoose.model('Bet', betSchema);
