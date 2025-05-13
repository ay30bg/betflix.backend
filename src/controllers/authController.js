// const User = require('../models/User');
// const Admin = require('../models/Admin');
// const Referral = require('../models/Referral');
// const ResetToken = require('../models/ResetToken');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail');

// // Function to generate a unique 8-digit numeric referral code
// const generateReferralCode = async () => {
//   const min = 10000000; // 00000000
//   const max = 99999999; // 99999999
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = Math.floor(Math.random() * (max - min + 1)) + min;
//     // Pad with leading zeros to ensure 8 digits
//     code = code.toString().padStart(8, '0');
//     // Check if code already exists
//     const existingReferral = await Referral.findOne({ code });
//     if (!existingReferral) {
//       isUnique = true;
//     }
//   }

//   return code;
// };

// const signup = async (req, res) => {
//   const { username, email, password, referralCode } = req.body;

//   console.log('Signup attempt:', { username, email, password: '****', referralCode });

//   if (!username || !email || !password) {
//     return res.status(400).json({ error: 'Username, email, and password are required' });
//   }

//   try {
//     const existingUser = await User.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) {
//       console.log('User already exists:', { email, username });
//       return res.status(400).json({ error: 'Username or email already taken' });
//     }

//     const user = await User.create({
//       username,
//       email,
//       password, // Hashed by pre('save')
//       balance: 0,
//     });
//     console.log('User created:', { id: user._id, email: user.email, passwordHash: user.password });

//     if (referralCode) {
//       // Validate referral code format (optional, since it’s 8 digits)
//       if (!/^\d{8}$/.test(referralCode)) {
//         console.warn('Invalid referral code format:', referralCode);
//       } else {
//         const referral = await Referral.findOne({ code: referralCode });
//         if (referral && !referral.referredUserId) {
//           await Referral.updateOne(
//             { code: referralCode },
//             { referredUserId: user._id }
//           );
//           await User.updateOne(
//             { _id: referral.referrerId },
//             { $inc: { balance: 50 } }
//           );
//           console.log('Referral applied:', { referralCode, referrerId: referral.referrerId });
//         } else {
//           console.warn('Referral not applied:', { referralCode, reason: referral ? 'Already used' : 'Not found' });
//         }
//       }
//     }

//     // Create a new referral code for the user
//     const newReferralCode = await generateReferralCode();
//     await Referral.create({
//       referrerId: user._id,
//       code: newReferralCode,
//     });
//     console.log('New referral code created:', { userId: user._id, code: newReferralCode });

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

//   console.log('Login attempt:', { email, password: '****' });

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const normalizedEmail = email.trim().toLowerCase();
//     console.log('Normalized email:', normalizedEmail);

//     const user = await User.findOne({ email: normalizedEmail });
//     if (!user) {
//       console.log('User not found for email:', normalizedEmail);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     console.log('Stored password hash:', user.password);
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       console.log('Password mismatch for user:', normalizedEmail);
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

// const adminSignup = async (req, res) => {
//   const { email, password, adminKey } = req.body;

//   console.log('Admin signup attempt:', { email, password: '****' });

//   if (!email || !password || !adminKey) {
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
//       return res.status(400).json({ error: 'Email already taken' });
//     }

//     const admin = await Admin.create({
//       email,
//       password, // Hashed by pre('save')
//     });
//     console.log('Admin created:', { id: admin._id, email: admin.email, passwordHash: admin.password });

//     const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.status(201).json({
//       token,
//       admin: { id: admin._id, email: admin.email },
//     });
//   } catch (err) {
//     console.error('Admin signup error:', err);
//     res.status(500).json({ error: 'Failed to sign up admin' });
//   }
// };

// const adminLogin = async (req, res) => {
//   const { email, password } = req.body;

//   console.log('Admin login attempt:', { email, password: '****' });

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const normalizedEmail = email.trim().toLowerCase();
//     console.log('Normalized email:', normalizedEmail);

//     const admin = await Admin.findOne({ email: normalizedEmail });
//     if (!admin) {
//       console.log('Admin not found for email:', normalizedEmail);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     console.log('Stored password hash:', admin.password);
//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch) {
//       console.log('Password mismatch for admin:', normalizedEmail);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.json({
//       token,
//       admin: { id: admin._id, email: admin.email },
//     });
//   } catch (err) {
//     console.error('Admin login error:', err);
//     res.status(500).json({ error: 'Failed to log in admin' });
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

//     const resetToken = await ResetToken.findOne({ userId: user._id, token });
//     if (!resetToken || resetToken.expires < Date.now()) {
//       return res.status(400).json({ error: 'Token expired or invalid' });
//     }

//     console.log('Updating password for user:', email, 'New password:', '****');
//     user.password = password;
//     await user.save();
//     console.log('Password updated for user:', email);

//     await ResetToken.deleteOne({ _id: resetToken._id });

//     res.status(200).json({ message: 'Password reset successful' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = { signup, login, logout, forgotPassword, resetPassword, adminSignup, adminLogin };

const User = require('../models/User');
const Admin = require('../models/Admin');
const Referral = require('../models/Referral');
const ResetToken = require('../models/ResetToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Function to generate a unique 8-digit numeric referral code
const generateReferralCode = async () => {
  const min = 10000000; // 00000000
  const max = 99999999; // 99999999
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(Math.random() * (max - min + 1)) + min;
    code = code.toString().padStart(8, '0');
    const existingReferral = await Referral.findOne({ code });
    if (!existingReferral) {
      isUnique = true;
    }
  }

  return code;
};

// Function to generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

const signup = async (req, res) => {
  const { username, email, password, referralCode } = req.body;

  console.log('Signup attempt:', { username, email, password: '****', referralCode });

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    const user = await User.create({
      username,
      email,
      password, // Hashed by pre('save')
      balance: 0.00,
      status: 'active',
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });
    console.log('User created:', {
      id: user._id,
      email: user.email,
      passwordHash: user.password,
      verificationCode,
    });

    if (referralCode) {
      if (!/^\d{8}$/.test(referralCode)) {
        console.warn('Invalid referral code format:', referralCode);
      } else {
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
          console.log('Referral applied:', { referralCode, referrerId: referral.referrerId });
        } else {
          console.warn('Referral not applied:', {
            referralCode,
            reason: referral ? 'Already used' : 'Not found',
          });
        }
      }
    }

    // Create a new referral code for the user
    const newReferralCode = await generateReferralCode();
    await Referral.create({
      referrerId: user._id,
      code: newReferralCode,
    });
    console.log('New referral code created:', { userId: user._id, code: newReferralCode });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
    const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2 style="color: #1e40af;">Betflix Email Verification</h2>
        <p>Please verify your email address to activate your account. Your verification code is:</p>
        <h3 style="color: #1e40af;">${verificationCode}</h3>
        <p>This code expires in 15 minutes. Click the button below to go to the verification page:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
        <p>If you did not sign up, please ignore this email.</p>
      </body>
      </html>
    `;
    await sendEmail(email, 'Betflix Email Verification', html);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isVerified: user.isVerified,
      },
      message: 'Signup successful, please verify your email',
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to sign up' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, password: '****' });

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Stored password hash:', user.password);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', normalizedEmail);
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

const adminSignup = async (req, res) => {
  const { email, password, adminKey } = req.body;

  console.log('Admin signup attempt:', { email, password: '****' });

  if (!email || !password || !adminKey) {
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
      return res.status(400).json({ error: 'Email already taken' });
    }

    const admin = await Admin.create({
      email,
      password, // Hashed by pre('save')
    });
    console.log('Admin created:', { id: admin._id, email: admin.email, passwordHash: admin.password });

    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ error: 'Failed to sign up admin' });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log('Admin login attempt:', { email, password: '****' });

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      console.log('Admin not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Stored password hash:', admin.password);
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for admin:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Failed to log in admin' });
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findOne({ _id: decoded.userId, email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    const resetToken = await ResetToken.findOne({ userId: user._id, token });
    if (!resetToken || resetToken.expires < Date.now()) {
      return res.status(400).json({ error: 'Token expired or invalid' });
    }

    console.log('Updating password for user:', email, 'New password:', '****');
    user.password = password;
    await user.save();
    console.log('Password updated for user:', email);

    await ResetToken.deleteOne({ _id: resetToken._id });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  console.log('Email verification attempt:', { email, code });

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', { email });
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      console.log('User already verified:', { email });
      return res.status(400).json({ error: 'Account already verified' });
    }

    if (user.verificationCode !== code) {
      console.log('Invalid verification code:', { email, code });
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > user.verificationCodeExpires) {
      console.log('Verification code expired:', { email });
      return res.status(400).json({ error: 'Verification code expired' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('Email verified:', { email });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Resend Verification Code
const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  console.log('Resend verification code attempt:', { email });

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', { email });
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      console.log('User already verified:', { email });
      return res.status(400).json({ error: 'Account already verified' });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
    const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2 style="color: #1e40af;">Betflix Email Verification</h2>
        <p>Please verify your email address to activate your account. Your new verification code is:</p>
        <h3 style="color: #1e40af;">${verificationCode}</h3>
        <p>This code expires in 15 minutes. Click the button below to go to the verification page:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
        <p>If you did not sign up, please ignore this email.</p>
      </body>
      </html>
    `;
    await sendEmail(email, 'Betflix Email Verification', html);

    console.log('Verification code resent:', { email, verificationCode });

    res.status(200).json({ message: 'Verification code resent' });
  } catch (err) {
    console.error('Resend verification code error:', err);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  adminSignup,
  adminLogin,
  verifyEmail,
  resendVerificationCode,
};
