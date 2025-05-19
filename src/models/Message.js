// models/Message.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sender: { type: String, required: true, enum: ['user', 'admin', 'anonymous'] },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: false }, // Optional for anonymous
  username: { type: String, required: false }, // Optional for anonymous
  email: { type: String, required: false }, // For anonymous submissions
  subject: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['Open', 'Responded'], default: 'Open' },
  replies: [replySchema],
});

module.exports = mongoose.model('Message', messageSchema);
