// // controllers/authController.js
// const User = require('../models/User');
// const Admin = require('../models/Admin');
// const Referral = require('../models/Referral');
// const ResetToken = require('../models/ResetToken');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail');

// // Generate a unique 8-digit numeric referral code
// const generateReferralCode = async () => {
//   const min = 10000000; // 00000000
//   const max = 99999999; // 99999999
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = Math.floor(Math.random() * (max - min + 1)) + min;
//     code = code.toString().padStart(8, '0');
//     const existingReferral = await Referral.findOne({ code });
//     if (!existingReferral) {
//       isUnique = true;
//     }
//   }

//   return code;
// };

// // Generate a 6-digit verification code
// const generateVerificationCode = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
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

//     const verificationCode = generateVerificationCode();
//     const verificationCodeExpires = Date.now() + 60 * 60 * 1000; // 1 hour

//     const user = await User.create({
//       username,
//       email,
//       password, // Hashed by pre('save')
//       balance: 0.00,
//       status: 'active',
//       verificationCode,
//       verificationCodeExpires,
//       isVerified: false,
//     });
//     console.log('User created:', {
//       id: user._id,
//       email: user.email,
//       verificationCode,
//     });

//     if (referralCode) {
//       if (!/^\d{8}$/.test(referralCode)) {
//         console.warn('Invalid referral code format:', referralCode);
//       } else {
//         const referral = await Referral.findOne({ code: referralCode });
//         if (referral && !referral.referredUsers.includes(user._id)) {
//           referral.referredUsers.push(user._id);
//           referral.totalBonus = (referral.totalBonus || 0) + 50;
//           referral.availableBonus = (referral.availableBonus || 0) + 50;
//           await referral.save();
//           console.log('Referral applied:', { referralCode, referrerId: referral.referrerId });
//         } else {
//           console.warn('Referral not applied:', {
//             referralCode,
//             reason: referral ? 'Already used or invalid' : 'Not found',
//           });
//         }
//       }
//     }

//     const newReferralCode = await generateReferralCode();
//     await Referral.create({
//       referrerId: user._id,
//       code: newReferralCode,
//       referredUsers: [],
//       totalBonus: 0,
//       availableBonus: 0,
//     });
//     console.log('New referral code created:', { userId: user._id, code: newReferralCode });

//     try {
//       const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
//       const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
//       const html = `
//         <!DOCTYPE html>
//         <html>
//         <body style="font-family: Arial, sans-serif; color: #1f2937;">
//           <h2 style="color: #1e40af;">Betflix Email Verification</h2>
//           <p>Your verification code is: <b>${verificationCode}</b></p>
//           <p>Enter this code on the verification page to confirm your email.</p>
//           <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
//           <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
//           <p>This code expires in 1 hour. If you did not sign up, ignore this email.</p>
//         </body>
//         </html>
//       `;
//       await sendEmail(email, 'Betflix Email Verification', html);
//       console.log('Verification email sent to:', email);
//     } catch (emailErr) {
//       console.error('Failed to send verification email:', emailErr);
//       await User.deleteOne({ _id: user._id });
//       await Referral.deleteOne({ referrerId: user._id });
//       return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Failed to sign up' });
//   }
// };

// // Middleware to authenticate JWT
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ error: 'Access denied: No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error('Token verification error:', err);
//     res.status(403).json({ error: 'Invalid or expired token' });
//   }
// };

// const verifyEmail = async (req, res) => {
//   const { email, code } = req.body;

//   if (!email || !code) {
//     return res.status(400).json({ error: 'Email and verification code are required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ error: 'Email already verified' });
//     }
//     if (user.verificationCode !== code) {
//       return res.status(400).json({ error: 'Invalid verification code' });
//     }
//     if (user.verificationCodeExpires < Date.now()) {
//       return res.status(400).json({ error: 'Verification code expired' });
//     }

//     user.isVerified = true;
//     user.verificationCode = undefined;
//     user.verificationCodeExpires = undefined;
//     await user.save();

//     console.log('Email verified for user:', email);
//     res.status(200).json({ message: 'Email verified successfully' });
//   } catch (err) {
//     console.error('Verify email error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// const resendVerification = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: 'Email is required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ error: 'Email already verified' });
//     }

//     const verificationCode = generateVerificationCode();
//     const verificationCodeExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     user.verificationCode = verificationCode;
//     user.verificationCodeExpires = verificationCodeExpires;
//     await user.save();

//     try {
//       const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
//       const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
//       const html = `
//         <!DOCTYPE html>
//         <html>
//         <body style="font-family: Arial, sans-serif; color: #1f2937;">
//           <h2 style="color: #1e40af;">Betflix Email Verification</h2>
//           <p>Your new verification code is: <b>${verificationCode}</b></p>
//           <p>Enter this code on the verification page to confirm your email.</p>
//           <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
//           <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
//           <p>This code expires in 1 hour. If you did not request this, ignore this email.</p>
//         </body>
//         </html>
//       `;
//       await sendEmail(email, 'Betflix Email Verification', html);
//       console.log('Verification email resent to:', email);
//     } catch (emailErr) {
//       console.error('Failed to resend verification email:', emailErr);
//       return res.status(500).json({ error: 'Failed to resend verification email' });
//     }

//     res.status(200).json({ message: 'Verification code resent' });
//   } catch (err) {
//     console.error('Resend verification error:', err);
//     res.status(500).json({ error: 'Server error' });
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
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//         isVerified: user.isVerified,
//       },
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
//     console.log('Admin created:', { id: admin._id, email: admin.email });

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

//     console.log('Updating password for user:', email);
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

// module.exports = {
//   signup,
//   login,
//   logout,
//   forgotPassword,
//   resetPassword,
//   adminSignup,
//   adminLogin,
//   verifyEmail,
//   resendVerification,
//   authenticateToken,
// };


// // controllers/authController.js
// const User = require('../models/User');
// const Admin = require('../models/Admin');
// const Referral = require('../models/Referral');
// const ResetToken = require('../models/ResetToken');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail');

// // Generate a unique 8-digit numeric referral code
// const generateReferralCode = async () => {
//   const min = 10000000;
//   const max = 99999999;
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = Math.floor(Math.random() * (max - min + 1)) + min;
//     code = code.toString().padStart(8, '0');
//     const existingReferral = await Referral.findOne({ code });
//     if (!existingReferral) {
//       isUnique = true;
//     }
//   }

//   return code;
// };

// // Generate a 6-digit verification code
// const generateVerificationCode = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
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

//     const verificationCode = generateVerificationCode();
//     const verificationCodeExpires = Date.now() + 60 * 60 * 1000;

//     const user = new User({
//       username,
//       email,
//       password,
//       balance: 0.00,
//       status: 'active',
//       verificationCode,
//       verificationCodeExpires,
//       isVerified: false,
//     });

//     if (referralCode) {
//       if (!/^\d{8}$/.test(referralCode)) {
//         console.warn('Invalid referral code format:', referralCode);
//       } else {
//         const referral = await Referral.findOne({ code: referralCode });
//         if (referral) {
//           user.referredBy = referral.referrerId;
//           referral.referredUsers.push({ userId: user._id, bonusEarned: 0 });
//           await referral.save();
//           console.log('Referral linked:', { referralCode, referrerId: referral.referrerId });
//         } else {
//           console.warn('Referral code not found:', referralCode);
//         }
//       }
//     }

//     await user.save();
//     console.log('User created:', {
//       id: user._id,
//       email: user.email,
//       verificationCode,
//     });

//     const newReferralCode = await generateReferralCode();
//     await Referral.create({
//       referrerId: user._id,
//       code: newReferralCode,
//       referredUsers: [],
//       totalBonus: 0,
//       availableBonus: 0,
//     });
//     console.log('New referral code created:', { userId: user._id, code: newReferralCode });

//     try {
//       const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
//       const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
//       const html = `
//         <!DOCTYPE html>
//         <html>
//         <body style="font-family: Arial, sans-serif; color: #1f2937;">
//           <h2 style="color: #1e40af;">Betflix Email Verification</h2>
//           <p>Your verification code is: <b>${verificationCode}</b></p>
//           <p>Enter this code on the verification page to confirm your email.</p>
//           <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
//           <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
//           <p>This code expires in 1 hour. If you did not sign up, ignore this email.</p>
//         </body>
//         </html>
//       `;
//       await sendEmail(email, 'Betflix Email Verification', html);
//       console.log('Verification email sent to:', email);
//     } catch (emailErr) {
//       console.error('Failed to send verification email:', emailErr);
//       await User.deleteOne({ _id: user._id });
//       await Referral.deleteOne({ referrerId: user._id });
//       return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Failed to sign up' });
//   }
// };

// // Middleware to authenticate JWT (replaced by authMiddleware.js)
// // const authenticateToken = (req, res, next) => { ... }; // Removed

// const verifyEmail = async (req, res) => {
//   const { email, code } = req.body;

//   if (!email || !code) {
//     return res.status(400).json({ error: 'Email and verification code are required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ error: 'Email already verified' });
//     }
//     if (user.verificationCode !== code) {
//       return res.status(400).json({ error: 'Invalid verification code' });
//     }
//     if (user.verificationCodeExpires < Date.now()) {
//       return res.status(400).json({ error: 'Verification code expired' });
//     }

//     user.isVerified = true;
//     user.verificationCode = undefined;
//     user.verificationCodeExpires = undefined;
//     await user.save();

//     console.log('Email verified for user:', email);
//     res.status(200).json({ message: 'Email verified successfully' });
//   } catch (err) {
//     console.error('Verify email error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// const resendVerification = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: 'Email is required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ error: 'Email already verified' });
//     }

//     const verificationCode = generateVerificationCode();
//     const verificationCodeExpires = Date.now() + 60 * 60 * 1000;
//     user.verificationCode = verificationCode;
//     user.verificationCodeExpires = verificationCodeExpires;
//     await user.save();

//     try {
//       const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
//       const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
//       const html = `
//         <!DOCTYPE html>
//         <html>
//         <body style="font-family: Arial, sans-serif; color: #1f2937;">
//           <h2 style="color: #1e40af;">Betflix Email Verification</h2>
//           <p>Your new verification code is: <b>${verificationCode}</b></p>
//           <p>Enter this code on the verification page to confirm your email.</p>
//           <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
//           <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
//           <p>This code expires in 1 hour. If you did not request this, ignore this email.</p>
//         </body>
//         </html>
//       `;
//       await sendEmail(email, 'Betflix Email Verification', html);
//       console.log('Verification email resent to:', email);
//     } catch (emailErr) {
//       console.error('Failed to resend verification email:', emailErr);
//       return res.status(500).json({ error: 'Failed to resend verification email' });
//     }

//     res.status(200).json({ message: 'Verification code resent' });
//   } catch (err) {
//     console.error('Resend verification error:', err);
//     res.status(500).json({ error: 'Server error' });
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

//     // Check if user is banned
//     if (user.status === 'banned') {
//       console.log('Login attempt by banned user:', normalizedEmail);
//       return res.status(403).json({ error: 'Your account is banned, contact support@betflixbets.vip' });
//     }

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
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         balance: user.balance,
//         status: user.status,
//         isVerified: user.isVerified,
//       },
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
//       password,
//     });
//     console.log('Admin created:', { id: admin._id, email: admin.email });

//     const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
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

//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch) {
//       console.log('Password mismatch for admin:', normalizedEmail);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
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
//         <a href="${resetLink}" style="display: inline-block; padding: 12 Olimp, color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
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

//     console.log('Updating password for user:', email);
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

// module.exports = {
//   signup,
//   login,
//   logout,
//   forgotPassword,
//   resetPassword,
//   adminSignup,
//   adminLogin,
//   verifyEmail,
//   resendVerification,
//   // authenticateToken removed, using authMiddleware.js
// };


const User = require('../models/User');
const Admin = require('../models/Admin');
const Referral = require('../models/Referral');
const ResetToken = require('../models/ResetToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate a unique 8-digit numeric referral code
const generateReferralCode = async () => {
  const min = 10000000;
  const max = 99999999;
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

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signup = async (req, res) => {
  const { username, email, password, referralCode } = req.body;

ස

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

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 60 * 60 * 1000;

    const user = new User({
      username,
      email,
      password,
      balance: 0.00,
      status: 'active',
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
    });

    if (referralCode) {
      if (!/^\d{8}$/.test(referralCode)) {
        console.warn('Invalid referral code format:', referralCode);
      } else {
        const referral = await Referral.findOne({ code: referralCode });
        if (referral) {
          user.referredBy = referral.referrerId;
          referral.referredUsers.push({ userId: user._id, bonusEarned: 0 });
          await referral.save();
          console.log('Referral linked:', { referralCode, referrerId: referral.referrerId });
        } else {
          console.warn('Referral code not found:', referralCode);
        }
      }

    await user.save();
    console.log('User created:', {
      id: user._id,
      email: user.email,
      verificationCode,
    });

    const newReferralCode = await generateReferralCode();
    await Referral.create({
      referrerId: user._id,
      code: newReferralCode,
      referredUsers: [],
      totalBonus: 0,
      availableBonus: 0,
    });
    console.log('New referral code created:', { userId: user._id, code: newReferralCode });

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
      const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2 style="color: #1e40af;">Betflix Email Verification</h2>
          <p>Your verification code is: <b>${verificationCode}</b></p>
          <p>Enter this code on the verification page to confirm your email.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
          <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
          <p>This code expires in 1 hour. If you did not sign up, ignore this email.</p>
        </body>
        </html>
      `;
      await sendEmail(email, 'Betflix Email Verification', html);
      console.log('Verification email sent to:', email);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      await User.deleteOne({ _id: user._id });
      await Referral.deleteOne({ referrerId: user._id });
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

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
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to sign up' });
  }
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('Email verified for user:', email);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 60 * 60 * 1000;
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
      const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2 style="color: #1e40af;">Betflix Email Verification</h2>
          <p>Your new verification code is: <b>${verificationCode}</b></p>
          <p>Enter this code on the verification page to confirm your email.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
          <p>If the button doesn't work, visit this link: <a href="${verifyLink}" style="color: #3b82f6;">${verifyLink}</a></p>
          <p>This code expires in 1 hour. If you did not request this, ignore this email.</p>
        </body>
        </html>
      `;
      await sendEmail(email, 'Betflix Email Verification', html);
      console.log('Verification email resent to:', email);
    } catch (emailErr) {
      console.error('Failed to resend verification email:', emailErr);
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }

    res.status(200).json({ message: 'Verification code resent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  console.l
og('Login attempt:', { email, password: '****' });

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

    // Check if user is banned
    if (user.status === 'banned') {
      console.log('Login attempt by banned user:', normalizedEmail);
      return res.status(403).json({ error: 'Your account is banned, contact support@betflixbets.vip' });
    }

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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        status: user.status,
        isVerified: user.isVerified,
      },
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
      password,
    });
    console.log('Admin created:', { id: admin._id, email: admin.email });

    const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
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

    const isMatch = await admin.comparePassword(password);
   მო�

    if (!isMatch) {
      console.log('Password mismatch for admin:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
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

    console.log('Updating password for user:', email);
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

const setWithdrawalPassword = async (req, res) => {
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
    const user = await User.findById(req.user.userId);
    if (!user) {
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
    res.status(500).json({ error: 'Server error' });
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
  resendVerification,
  setWithdrawalPassword,
};
