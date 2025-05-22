// // models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true, trim: true },
//   email: { type: String, required: true, unique: true, trim: true, lowercase: true },
//   password: { type: String, required: true },
//   balance: { type: Number, default: 0.00 },
//   status: { type: String, enum: ['active', 'banned'], default: 'active' },
//   verificationCode: { type: String },
//   isVerified: { type: Boolean, default: false },
//   referredBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null, // Tracks the user who referred this user
//   },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// }, { timestamps: true });

// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     console.log('Hashing password for user:', this.email);
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  withdrawalPassword: { type: String }, // Store hashed withdrawal password
  balance: { type: Number, default: 0.00 },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    console.log('Hashing password for user:', this.email);
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified('withdrawalPassword') && this.withdrawalPassword) {
    console.log('Hashing withdrawal password for user:', this.email);
    this.withdrawalPassword = await bcrypt.hash(this.withdrawalPassword, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareWithdrawalPassword = async function (candidatePassword) {
  if (!this.withdrawalPassword) {
    return false; // No withdrawal password set
  }
  return await bcrypt.compare(candidatePassword, this.withdrawalPassword);
};

module.exports = mongoose.model('User', userSchema);
