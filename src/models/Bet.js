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
      message: (props) => `${props.value} is not a valid value for ${this.type} bet`,
    },
  },
  amount: { type: Number, required: true, min: [0, 'Amount must be positive'] },
  clientSeed: { type: String }, // Optional, used in placeBet
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending',
    required: true,
  },
  result: { type: String }, // Stores resultColor or resultNumber as string
  won: { type: Boolean }, // True if bet won
  payout: { type: Number, default: 0 }, // Payout amount
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Bet', betSchema);
