// // models/Referral.js
// const mongoose = require('mongoose');

// const referralSchema = new mongoose.Schema({
//   referrerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   code: {
//     type: String, // Store as string to preserve leading zeros
//     required: true,
//     unique: true,
//     match: /^\d{8}$/, // Ensure exactly 8 digits
//   },
//   referredUsers: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   }],
//   totalBonus: {
//     type: Number,
//     default: 0, // Total bonus earned from referrals
//   },
//   availableBonus: {
//     type: Number,
//     default: 0, // Bonus available for withdrawal
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model('Referral', referralSchema);

// models/Referral.js
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{8}$/,
  },
  referredUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bonusEarned: {
      type: Number,
      default: 0, // Bonus from this user’s deposits
    },
  }],
  totalBonus: {
    type: Number,
    default: 0,
  },
  availableBonus: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Referral', referralSchema);

