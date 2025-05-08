// src/controllers/userController.js
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      username: user.username,
      email: user.email,
      balance: user.balance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username: username.trim(), updatedAt: Date.now() },
      { new: true, select: '-password' }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        username: user.username,
        email: user.email,
        balance: user.balance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
