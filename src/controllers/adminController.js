const User = require('../models/User');

// Get Admin Dashboard
const getDashboard = async (req, res) => {
  try {
    res.json({
      message: 'Welcome to the admin dashboard',
      adminId: req.admin.id,
      role: req.admin.role,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting their own account (if applicable)
    // Note: Since admins are in a separate model, this may not apply, but included for completeness
    if (userId === req.admin.id) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    await User.deleteOne({ _id: userId });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  deleteUser,
};
