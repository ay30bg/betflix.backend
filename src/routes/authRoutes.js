// // backend/routes/auth.js
// const express = require('express');
// const router = express.Router();
// const { login, logout, signup, forgotPassword, resetPassword, adminLogin } = require('../controllers/authController');
// const rateLimit = require('express-rate-limit');

// const forgotPasswordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { error: 'Too many password reset requests, please try again later.' },
// });

// // Rate limiter for admin login
// const adminLoginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: { error: 'Too many admin login attempts, please try again later.' },
// });

// router.post('/login', login);
// router.post('/logout', logout);
// router.post('/signup', signup);
// router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
// router.post('/reset-password', resetPassword);
// router.post('/api/auth/admin/login', adminLoginLimiter, adminLogin); // Add admin login route

// module.exports = router;

const express = require('express');
const router = express.Router();
const { login, logout, signup, forgotPassword, resetPassword, adminLogin, verifyEmail, resendVerification } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');


const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests, please try again later.' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many admin login attempts, please try again later.' },
});

router.post('/login', login);
router.post('/logout', logout);
router.post('/signup', signup);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/api/auth/admin/login', adminLoginLimiter, adminLogin);
router.post('/verify-email', verifyEmail); // Add verify-email route
router.post('/resend-verification', resendVerification); // Add resend-verification route

module.exports = router;
