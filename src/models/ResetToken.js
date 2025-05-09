// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // Changed from 'bcrypt' to 'bcryptjs'

// const resetTokenSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'User',
//   },
//   token: {
//     type: String,
//     required: true,
//   },
//   expires: {
//     type: Date,
//     required: true,
//   },
// });

// resetTokenSchema.pre('save', async function (next) {
//   if (this.isModified('token')) {
//     this.token = await bcrypt.hash(this.token, 10);

const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);
//   }
//   next();
// });

// module.exports = mongoose.model('ResetToken', resetTokenSchema);
