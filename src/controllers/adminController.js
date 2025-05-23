// //backend/admin.js
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const mongoose = require('mongoose'); 
// const axios = require('axios');
// const Admin = require('../models/Admin');
// const User = require('../models/User');
// const WithdrawalRequest = require('../models/WithdrawalRequest'); // Add WithdrawalRequest model

// // Validate environment variables at startup
// if (!process.env.ADMIN_KEY) {
//   console.error('Error: ADMIN_KEY is not defined in environment variables');
//   throw new Error('ADMIN_KEY is required');
// }
// if (!process.env.JWT_SECRET) {
//   console.error('Error: JWT_SECRET is not defined in environment variables');
//   throw new Error('JWT_SECRET is required');
// }
// if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//   console.error('Error: EMAIL_USER or EMAIL_PASS is not defined in environment variables');
//   throw new Error('Email configuration is required');
// }
// if (!process.env.NOWPAYMENTS_API_KEY || !process.env.NOWPAYMENTS_API_URL) {
//   console.error('Error: NOWPAYMENTS_API_KEY or NOWPAYMENTS_API_URL is not defined');
//   throw new Error('NOWPayments configuration is required');
// }

// // Configure nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Admin Signup
// const signupAdmin = async (req, res) => {
//   const { email, password, adminKey } = req.body;

//   console.log('Admin signup attempt:', { email, adminKeyProvided: !!adminKey });

//   if (!email || !password || !adminKey) {
//     console.log('Missing required fields:', { email, passwordProvided: !!password, adminKeyProvided: !!adminKey });
//     return res.status(400).json({ error: 'Email, password, and admin key are required' });
//   }

//   if (adminKey !== process.env.ADMIN_KEY) {
//     console.log('Invalid admin key for email:', email);
//     return res.status(403).json({ error: 'Invalid admin key' });
//   }

//   try {
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       console.log('Admin already exists:', { email });
//       return res.status(400).json({ error: 'Email already in use' });
//     }

//     const admin = new Admin({ email, password });
//     await admin.save();

//     const token = jwt.sign(
//       { id: admin._id, role: 'admin' },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     console.log(`New admin created: ${email}`);
//     res.status(201).json({
//       token,
//       admin: {
//         id: admin._id,
//         email: admin.email,
//       },
//     });
//   } catch (err) {
//     console.error('Admin signup error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Admin Login
// const loginAdmin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { id: admin._id, role: 'admin' },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     console.log(`Admin logged in: ${email}`);
//     res.json({
//       message: 'Login successful',
//       token,
//       admin: {
//         id: admin._id,
//         email: admin.email,
//       },
//     });
//   } catch (err) {
//     console.error('Admin login error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Forgot Password
// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }

//     const resetToken = crypto.randomBytes(20).toString('hex');
//     admin.resetPasswordToken = resetToken;
//     admin.resetPasswordExpires = Date.now() + 3600000;

//     await admin.save();

//     const resetUrl = `${process.env.ADMIN_FRONTEND_URL}/reset-password?token=${resetToken}`;
//     const mailOptions = {
//       to: admin.email,
//       from: process.env.EMAIL_USER,
//       subject: 'Password Reset Request',
//       text: `You are receiving this because you (or someone else) have requested a password reset.\n\n
//         Please click the following link to reset your password:\n${resetUrl}\n\n
//         If you did not request this, please ignore this email.`,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Password reset email sent to: ${email}`);
//     res.json({ message: 'Password reset email sent' });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Reset Password
// const resetPassword = async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

//   try {
//     const admin = await Admin.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!admin) {
//       return res.status(400).json({ error: 'Invalid or expired token' });
//     }

//     admin.password = password;
//     admin.resetPasswordToken = undefined;
//     admin.resetPasswordExpires = undefined;

//     await admin.save();
//     console.log(`Password reset for admin: ${admin.email}`);
//     res.json({ message: 'Password reset successfully' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Get Admin Dashboard
// const getDashboard = async (req, res) => {
//   try {
//     res.json({
//       message: 'Welcome to the admin dashboard',
//       adminId: req.admin.id,
//       role: 'admin',
//     });
//   } catch (err) {
//     console.error('Dashboard error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // Get All Users
// const getAllUsers = async (req, res) => {
//   try {
//     const { search = '' } = req.query;
//     const query = search
//       ? {
//           $or: [
//             { username: { $regex: search, $options: 'i' } },
//             { email: { $regex: search, $options: 'i' } },
//           ],
//         }
//       : {};

//     const users = await User.find(query).select('-password');
//     console.log(`Fetched users with search term "${search}": ${users.length} found`);
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

//     if (username) user.username = username;
//     if (email) user.email = email;
//     if (typeof balance === 'number') user.balance = parseFloat(balance.toFixed(2));

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
//   const { status } = req.body;

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

// // New endpoint: Get Total Revenue from NOWPayments
// const getTotalRevenue = async (req, res) => {
//   try {
//     // Fetch balance from NOWPayments
//     const response = await axios.get(`${process.env.NOWPAYMENTS_API_URL}/balance`, {
//       headers: {
//         'x-api-key': process.env.NOWPAYMENTS_API_KEY,
//       },
//     });

//     // Check if response contains balance data
//     if (response.data && response.data.currencies) {
//       let totalBalance = 0;
//       // Sum balances across all currencies (assuming they're in a common unit or USD for simplicity)
//       for (const currency of response.data.currencies) {
//         totalBalance += parseFloat(currency.balance || 0);
//       }

//       console.log(`Admin ${req.admin.id} fetched total revenue: ${totalBalance}`);
//       res.json({ totalRevenue: totalBalance.toFixed(2) });
//     } else {
//       throw new Error('Invalid response from NOWPayments');
//     }
//   } catch (err) {
//     console.error('Error fetching total revenue:', err.message);
//     res.status(500).json({ error: 'Failed to fetch total revenue' });
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

// // Get Withdrawal Requests
// const getPendingWithdrawalRequests = async (req, res) => {
//   try {
//     const { status } = req.query; // Allow filtering by status (e.g., pending, approved, rejected)
//     const query = status ? { status } : {};
//     const requests = await WithdrawalRequest.find(query).populate('userId', 'email');
//     res.json(requests);
//   } catch (err) {
//     console.error('Error fetching withdrawal requests:', err);
//     res.status(500).json({ error: 'Failed to fetch withdrawal requests', details: err.message });
//   }
// };

// // Approve or Reject Withdrawal Request
// const updateWithdrawalRequest = async (req, res) => {
//   const { requestId, action } = req.body;
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const withdrawalRequest = await WithdrawalRequest.findById(requestId).session(session);
//     if (!withdrawalRequest) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: 'Withdrawal request not found' });
//     }

//     if (action === 'approve') {
//       withdrawalRequest.status = 'approved';
//       // Optionally, process the withdrawal via NOWPayments here
//     } else if (action === 'reject') {
//       withdrawalRequest.status = 'rejected';
//       // Refund the amount to the user's balance
//       const user = await User.findById(withdrawalRequest.userId).session(session);
//       if (user) {
//         user.balance += withdrawalRequest.amount;
//         await user.save({ session });
//       }
//     } else {
//       await session.abortTransaction();
//       return res.status(400).json({ error: 'Invalid action' });
//     }

//     await withdrawalRequest.save({ session });
//     await session.commitTransaction();
//     res.json({ message: `Withdrawal request ${action}d successfully` });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error('Error updating withdrawal request:', err);
//     res.status(500).json({ error: `Failed to ${action} withdrawal request`, details: err.message });
//   } finally {
//     session.endSession();
//   }
// };

// module.exports = {
//   signupAdmin,
//   loginAdmin,
//   forgotPassword,
//   resetPassword,
//   getDashboard,
//   getAllUsers,
//   editUser,
//   toggleBanUser,
//   deleteUser,
//   getPendingWithdrawalRequests,
//   updateWithdrawalRequest,
//   getTotalRevenue,
// };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const Admin = require('../models/Admin');
const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Round = require('../models/Round'); // Add Round model import

// Validate environment variables at startup
if (!process.env.ADMIN_KEY) {
  console.error('Error: ADMIN_KEY is not defined in environment variables');
  throw new Error('ADMIN_KEY is required');
}
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in environment variables');
  throw new Error('JWT_SECRET is required');
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Error: EMAIL_USER or EMAIL_PASS is not defined in environment variables');
  throw new Error('Email configuration is required');
}
if (!process.env.NOWPAYMENTS_API_KEY || !process.env.NOWPAYMENTS_API_URL) {
  console.error('Error: NOWPAYMENTS_API_KEY or NOWPAYMENTS_API_URL is not defined');
  throw new Error('NOWPayments configuration is required');
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Admin Signup
const signupAdmin = async (req, res) => {
  const { email, password, adminKey } = req.body;

  console.log('Admin signup attempt:', { email, adminKeyProvided: !!adminKey });

  if (!email || !password || !adminKey) {
    console.log('Missing required fields:', { email, passwordProvided: !!password, adminKeyProvided: !!adminKey });
    return res.status(400).json({ error: 'Email, password, and admin key are required' });
  }

  if (adminKey !== process.env.ADMIN_KEY) {
    console.log('Invalid admin key for email:', email);
    return res.status(403).json({ error: 'Invalid admin key' });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists:', { email });
      return res.status(400).json({ error: 'Email already in use' });
    }

    const admin = new Admin({ email, password });
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`New admin created: ${email}`);
    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 3600000;

    await admin.save();

    const resetUrl = `${process.env.ADMIN_FRONTEND_URL}/reset-password?token=${resetToken}`;
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
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

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
    const { search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query).select('-password');
    console.log(`Fetched users with search term "${search}": ${users.length} found`);
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
  const { status } = req.body;

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

// Get Total Revenue from NOWPayments
const getTotalRevenue = async (req, res) => {
  try {
    const response = await axios.get(`${process.env.NOWPAYMENTS_API_URL}/balance`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      },
    });

    if (response.data && response.data.currencies) {
      let totalBalance = 0;
      for (const currency of response.data.currencies) {
        totalBalance += parseFloat(currency.balance || 0);
      }

      console.log(`Admin ${req.admin.id} fetched total revenue: ${totalBalance}`);
      res.json({ totalRevenue: totalBalance.toFixed(2) });
    } else {
      throw new Error('Invalid response from NOWPayments');
    }
  } catch (err) {
    console.error('Error fetching total revenue:', err.message);
    res.status(500).json({ error: 'Failed to fetch total revenue' });
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

// Get Withdrawal Requests
const getPendingWithdrawalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await WithdrawalRequest.find(query).populate('userId', 'email');
    res.json(requests);
  } catch (err) {
    console.error('Error fetching withdrawal requests:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawal requests', details: err.message });
  }
};

// Approve or Reject Withdrawal Request
const updateWithdrawalRequest = async (req, res) => {
  const { requestId, action } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawalRequest = await WithdrawalRequest.findById(requestId).session(session);
    if (!withdrawalRequest) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (action === 'approve') {
      withdrawalRequest.status = 'approved';
    } else if (action === 'reject') {
      withdrawalRequest.status = 'rejected';
      const user = await User.findById(withdrawalRequest.userId).session(session);
      if (user) {
        user.balance += withdrawalRequest.amount;
        await user.save({ session });
      }
    } else {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid action' });
    }

    await withdrawalRequest.save({ session });
    await session.commitTransaction();
    res.json({ message: `Withdrawal request ${action}d successfully` });
  } catch (err) {
    await session.abortTransaction();
    console.error('Error updating withdrawal request:', err);
    res.status(500).json({ error: `Failed to ${action} withdrawal request`, details: err.message });
  } finally {
    session.endSession();
  }
};

// New Endpoint: Get Active Rounds Count
const getActiveRounds = async (req, res) => {
  try {
    const currentTime = new Date();
    const activeRoundsCount = await Round.countDocuments({
      expiresAt: { $gt: currentTime },
    });

    console.log(`Admin ${req.admin.id} fetched active rounds: ${activeRoundsCount}`);
    res.json({ activeRounds: activeRoundsCount });
  } catch (err) {
    console.error('Error fetching active rounds:', err);
    res.status(500).json({ error: 'Failed to fetch active rounds', details: err.message });
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
  getPendingWithdrawalRequests,
  updateWithdrawalRequest,
  getTotalRevenue,
  getActiveRounds, // Export the new endpoint
};
