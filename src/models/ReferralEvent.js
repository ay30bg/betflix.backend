const referralEventSchema = new mongoose.Schema({
  eventType: { type: String, enum: ['GENERATED', 'USED'], required: true },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Map, of: String, default: {} },
});
