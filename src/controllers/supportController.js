// controllers/supportController.js
const Message = require('../models/Message');

// Get messages (user: by userId, admin: all)
const getMessages = async (req, res) => {
  try {
    let query = req.admin ? {} : { userId: req.user.id };
    const messages = await Message.find(query).sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new message (user only)
const createMessage = async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    const newMessage = new Message({
      userId: req.user.id,
      username: req.user.username,
      subject,
      message,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add a reply to a message (user or admin)
const addReply = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (req.user && msg.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    msg.replies.push({
      sender: req.admin ? 'admin' : 'user',
      message,
    });
    msg.status = req.admin ? 'Responded' : 'Open';
    await msg.save();
    res.json(msg);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMessages, createMessage, addReply };
