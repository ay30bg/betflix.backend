// const User = require('../models/User');

// // Get Admin Dashboard
// const getDashboard = async (req, res) => {
//   try {
//     res.json({
//       message: 'Welcome to the admin dashboard',
//       adminId: req.admin.id,
//       role: req.admin.role,
//     });
//   } catch (err) {
//     console.error('Dashboard error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Get All Users
// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select('-password'); // Exclude passwords
//     res.json(users);
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Delete User
// const deleteUser = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Prevent admin from deleting their own account (if applicable)
//     // Note: Since admins are in a separate model, this may not apply, but included for completeness
//     if (userId === req.admin.id) {
//       return res.status(403).json({ error: 'Cannot delete your own account' });
//     }

//     await User.deleteOne({ _id: userId });
//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting user:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = {
//   getDashboard,
//   getAllUsers,
//   deleteUser,
// };

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

// Edit User
const editUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email, balance } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (typeof balance === 'number') user.balance = parseFloat(balance.toFixed(2)); // Ensure 2 decimal places

    await user.save();
    console.log(`Admin ${req.admin.id} edited user ${userId}`);
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Error editing user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Ban or Unban User
const toggleBanUser = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // 'active' or 'banned'

  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = status;
    await user.save();
    console.log(`Admin ${req.admin.id} set user ${userId} status to ${status}`);
    res.json({
      message: `User ${status} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Error updating user status:', err);
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

    await User.deleteOne({ _id: userId });
    console.log(`Admin ${req.admin.id} deleted user ${userId}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  editUser,
  toggleBanUser,
  deleteUser,
};
