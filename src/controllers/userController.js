const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email balance');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username cannot be empty' });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, updatedAt: Date.now() },
      { new: true, select: 'username email balance' }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { getProfile, updateProfile };