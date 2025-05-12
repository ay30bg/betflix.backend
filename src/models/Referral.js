// const mongoose = require('mongoose');

// const referralSchema = new mongoose.Schema({
//   referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
//   code: { type: String, required: true, unique: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Referral', referralSchema);

// models/Referral.js
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  code: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day expiration
  },
});

module.exports = mongoose.model('Referral', referralSchema);
