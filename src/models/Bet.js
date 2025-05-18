// const mongoose = require('mongoose');

// const betSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   period: { type: String, required: true },
//   type: { type: String, enum: ['color', 'number'], required: true },
//   value: {
//     type: String,
//     required: true,
//     validate: {
//       validator: function (v) {
//         if (this.type === 'color') return ['Green', 'Red'].includes(v);
//         if (this.type === 'number') return /^\d$/.test(v); // Single digit 0-9
//         return false;
//       },
//       message: props => `${props.value} is not a valid value for ${this.type} bet`,
//     },
//   },
//   amount: { type: Number, required: true, min: [0, 'Amount must be positive'] },
//   clientSeed: { type: String }, // Optional, used in placeBet
//   result: { type: String }, // Stores resultColor or resultNumber as string
//   won: { type: Boolean }, // True if bet won
//   payout: { type: Number, default: 0 }, // Payout amount
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Bet', betSchema);

const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  type: { type: String, enum: ['color', 'number'], required: true },
  value: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        if (this.type === 'color') return ['Green', 'Red'].includes(v);
        if (this.type === 'number') return /^\d$/.test(v); // Single digit 0-9
        return false;
      },
      message: (props) => `${props.value} is not a valid value for type ${props.instance.type}`,
    },
  },
  amount: { type: Number, required: true, min: [0, 'Amount must be positive'] },
  clientSeed: { type: String, required: true }, // Made required to match placeBet validation
  result: { type: String }, // Stores resultColor or resultNumber as string
  won: { type: Boolean }, // True if bet won
  payout: { type: Number, default: 0 }, // Payout amount
  status: {
    type: String,
    enum: ['pending', 'finalized', 'invalid'],
    default: 'pending',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

// Update updatedAt before saving
betSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bet', betSchema);
