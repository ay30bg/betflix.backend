// const User = require('../models/User');
// const Referral = require('../models/Referral');
// const ResetToken = require('../models/ResetToken');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const sendEmail = require('../utils/sendEmail');

// const signup = async (req, res) => {
//   const { username, email, password, referralCode } = req.body;

//   if (!username || !email || !password) {
//     return res.status(400).json({ error: 'Username, email, and password are required' });
//   }

//   try {
//     const existingUser = await User.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) {
//       return res.status(400).json({ error: 'Username or email already taken' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       balance: 0,
//     });

//     if (referralCode) {
//       const referral = await Referral.findOne({ code: referralCode });
//       if (referral && !referral.referredUserId) {
//         await Referral.updateOne(
//           { code: referralCode },
//           { referredUserId: user._id }
//         );
//         await User.updateOne(
//           { _id: referral.referrerId },
//           { $inc: { balance: 50 } }
//         );
//       }
//     }

//     await Referral.create({
//       referrerId: user._id,
//       code: uuidv4(),
//     });

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.status(201).json({
//       token,
//       user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Failed to sign up' });
//   }
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const user = await User.findOne({ email });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.json({
//       token,
//       user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ error: 'Failed to log in' });
//   }
// };

// const logout = (req, res) => {
//   res.json({ message: 'Logged out successfully' });
// };

// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: 'Email is required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     await ResetToken.create({
//       userId: user._id,
//       token,
//       expires: Date.now() + 60 * 60 * 1000,
//     });

//     const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
//     const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}&email=${email}`;
//     console.log('Generated reset link:', resetLink);

//     const html = `
//       <!DOCTYPE html>
//       <html>
//       <body style="font-family: Arial, sans-serif; color: #1f2937;">
//         <h2 style="color: #1e40af;">Betflix Password Reset</h2>
//         <p>You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
//         <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
//         <p>If the button doesn't work, copy and paste this link into your browser:</p>
//         <p><a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a></p>
//         <p>If you did not request this, please ignore this email.</p>
//       </body>
//       </html>
//     `;
//     await sendEmail(email, 'Betflix Password Reset', html);

//     res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// const resetPassword = async (req, res) => {
//   const { token, email, password } = req.body;

//   if (!token || !email || !password) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   try {
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(400).json({ error: 'Invalid or expired token' });
//     }

//     const user = await User.findOne({ _id: decoded.userId, email });
//     if (!user) {
//       return res.status(400).json({ error: 'Invalid user' });
//     }

//     const resetToken = await ResetToken.findOne({ userId: user._id });
//     if (!resetToken || resetToken.expires < Date.now()) {
//       return res.status(400).json({ error: 'Token expired' });
//     }

//     const isTokenValid = await bcrypt.compare(token, resetToken.token);
//     if (!isTokenValid) {
//       return res.status(400).json({ error: 'Invalid token' });
//     }

//     // Set plain-text password and let pre('save') hook hash it
//     user.password = password;
//     await user.save();
//     console.log('Password updated for user:', email); // Debugging

//     await ResetToken.deleteOne({ _id: resetToken._id });

//     res.status(200).json({ message: 'Password reset successful' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = { signup, login, logout, forgotPassword, resetPassword };

const User = require('../models/User');
const Referral = require('../models/Referral');
const ResetToken = require('../models/ResetToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/sendEmail');

const signup = async (req, res) => {
  const { username, email, password, referralCode } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      balance: 0,
    });

    if (referralCode) {
      const referral = await Referral.findOne({ code: referralCode });
      if (referral && !referral.referredUserId) {
        await Referral.updateOne(
          { code: referralCode },
          { referredUserId: user._id }
        );
        await User.updateOne(
          { _id: referral.referrerId },
          { $inc: { balance: 50 } }
        );
      }
    }

    await Referral.create({
      referrerId: user._id,
      code: uuidv4(),
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to sign up' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await ResetToken.create({
      userId: user._id,
      token,
      expires: Date.now() + 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}&email=${email}`;
    console.log('Generated reset link:', resetLink);

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2 style="color: #1e40af;">Betflix Password Reset</h2>
        <p>You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
      </html>
    `;
    await sendEmail(email, 'Betflix Password Reset', html);

    res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Find the user
    const user = await User.findOne({ _id: decoded.userId, email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    // Find the reset token
    const resetToken = await ResetToken.findOne({ userId: user._id, token });
    if (!resetToken || resetToken.expires < Date.now()) {
      return res.status(400).json({ error: 'Token expired or invalid' });
    }

    // Update the password (pre('save') hook will hash it)
    user.password = password;
    await user.save();
    console.log('Password updated for user:', email);

    // Delete the used reset token
    await ResetToken.deleteOne({ _id: resetToken._id });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, login, logout, forgotPassword, resetPassword };
