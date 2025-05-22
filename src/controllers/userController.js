// // src/controllers/userController.js
// const User = require('../models/User');

// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json({
//       username: user.username,
//       email: user.email,
//       balance: user.balance,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     });
//   } catch (err) {
//     console.error('Get profile error:', err);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

// exports.updateProfile = async (req, res) => {
//   try {
//     const { username } = req.body;
//     if (!username || !username.trim()) {
//       return res.status(400).json({ error: 'Username is required' });
//     }
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { username: username.trim(), updatedAt: Date.now() },
//       { new: true, select: '-password' }
//     );
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json({
//       user: {
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         createdAt: user.createdAt,
//         updatedAt: user.updatedAt,
//       },
//     });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     res.status(500).json({ error: 'Server error', details: err.message });
//   }
// };

const mongoose = require('mongoose');
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

exports.setWithdrawalPassword = async (req, res) => {
  console.log('Received body:', req.body); // Debug log
  const { withdrawalPassword, confirmPassword } = req.body;

  if (!withdrawalPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Both password and confirm password are required' });
  }

  if (withdrawalPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (withdrawalPassword.length < 6) {
    return res.status(400).json({ error: 'Withdrawal password must be at least 6 characters long' });
  }

  try {
    console.log('Finding user with ID:', req.user.id); // Debug log
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.log('Invalid user ID:', req.user.id);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    user.withdrawalPassword = withdrawalPassword;
    await user.save();
    console.log('Withdrawal password set for user:', user.email);
    res.status(200).json({ message: 'Withdrawal password set successfully' });
  } catch (err) {
    console.error('Set withdrawal password error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
