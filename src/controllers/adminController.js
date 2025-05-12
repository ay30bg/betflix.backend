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

// // Edit User
// const editUser = async (req, res) => {
//   const { userId } = req.params;
//   const { username, email, balance } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Update fields if provided
//     if (username) user.username = username;
//     if (email) user.email = email;
//     if (typeof balance === 'number') user.balance = parseFloat(balance.toFixed(2)); // Ensure 2 decimal places

//     await user.save();
//     console.log(`Admin ${req.admin.id} edited user ${userId}`);
//     res.json({
//       message: 'User updated successfully',
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//       },
//     });
//   } catch (err) {
//     console.error('Error editing user:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Ban or Unban User
// const toggleBanUser = async (req, res) => {
//   const { userId } = req.params;
//   const { status } = req.body; // 'active' or 'banned'

//   if (!['active', 'banned'].includes(status)) {
//     return res.status(400).json({ error: 'Invalid status' });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     user.status = status;
//     await user.save();
//     console.log(`Admin ${req.admin.id} set user ${userId} status to ${status}`);
//     res.json({
//       message: `User ${status} successfully`,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//       },
//     });
//   } catch (err) {
//     console.error('Error updating user status:', err);
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

//     await User.deleteOne({ _id: userId });
//     console.log(`Admin ${req.admin.id} deleted user ${userId}`);
//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting user:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = {
//   getDashboard,
//   getAllUsers,
//   editUser,
//   toggleBanUser,
//   deleteUser,
// };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Admin = require('../models/Admin'); // Use Admin model
const User = require('../models/User');   // Use User model for user management

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Update with your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Admin Signup
const signupAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create new admin
    const admin = new Admin({ email, password });
    await admin.save();

    console.log(`New admin created: ${email}`);
 Packers fan arrested after bringing gun to Steelers game, police say
Packers fan arrested after bringing gun to Steelers game, police say
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Admin logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await admin.save();

    // Send email
    const resetUrl = `http://your-frontend-url/reset-password/${resetToken}`;
    const mailOptions = {
      to: admin.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested a password reset.\n\n
        Please click the following link to reset your password:\n${resetUrl}\n\n
        If you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Find admin by reset token and check expiration
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password
    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();
    console.log(`Password reset for admin: ${admin.email}`);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Admin Dashboard
const getDashboard = async (req, res) => {
  try {
    res.json({
      message: 'Welcome to the admin dashboard',
      adminId: req.admin.id,
      role: 'admin',
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
    if (typeof balance === 'number') user.balance = parseFloat(balance.toFixed(2));

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
  signupAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  getDashboard,
  getAllUsers,
  editUser,
  toggleBanUser,
  deleteUser,
};
