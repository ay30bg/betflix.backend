// const mongoose = require('mongoose');

// const referralSchema = new mongoose.Schema({
//   referrerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true,
//   },
//   referredUsers: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   }],
//   code: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   expiresAt: {
//     type: Date,
//     default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day expiration
//   },
// });

// module.exports = mongoose.model('Referral', referralSchema);

const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String, // Store as string to preserve leading zeros
    required: true,
    unique: true,
    match: /^\d{8}$/, // Ensure exactly 8 digits
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Referral', referralSchema);
