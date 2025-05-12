// const express = require('express');
// const router = express.Router();
// const { getDashboard, getAllUsers, deleteUser } = require('../controllers/adminController');
// const adminAuthMiddleware = require('../middleware/adminAuth');

// // Admin Dashboard
// router.get('/dashboard', adminAuthMiddleware, getDashboard);

// // Get All Users
// router.get('/users', adminAuthMiddleware, getAllUsers);

// // Delete User
// router.delete('/users/:userId', adminAuthMiddleware, deleteUser);

// module.exports = router;


// const express = require('express');
// const router = express.Router();
// const { getDashboard, getAllUsers, editUser, toggleBanUser, deleteUser } = require('../controllers/adminController');
// const adminAuthMiddleware = require('../middleware/adminAuth');
// const { body, param, validationResult } = require('express-validator');
// const rateLimit = require('express-rate-limit');

// // Rate limiter for admin actions
// const adminActionLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
//   message: { error: 'Too many requests, please try again later.' },
// });

// // Validation middleware
// const validateUserEdit = [
//   param('userId').isMongoId().withMessage('Invalid user ID'),
//   body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
//   body('email').optional().isEmail().withMessage('Invalid email'),
//   body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
// ];

// const validateBanStatus = [
//   param('userId').isMongoId().withMessage('Invalid user ID'),
//   body('status').isIn(['active', 'banned']).withMessage('Status must be "active" or "banned"'),
// ];

// // Admin Dashboard
// router.get('/dashboard', adminActionLimiter, adminAuthMiddleware, getDashboard);

// // Get All Users
// router.get('/users', adminActionLimiter, adminAuthMiddleware, getAllUsers);

// // Edit User
// router.put('/users/:userId', adminActionLimiter, adminAuthMiddleware, validateUserEdit, (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   editUser(req, res, next);
// });

// // Ban or Unban User
// router.put('/users/:userId/status', adminActionLimiter, adminAuthMiddleware, validateBanStatus, (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   toggleBanUser(req, res, next);
// });

// // Delete User
// router.delete('/users/:userId', adminActionLimiter, adminAuthMiddleware, [
//   param('userId').isMongoId().withMessage('Invalid user ID'),
// ], (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   deleteUser(req, res, next);
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Public routes
router.post('/signup', adminController.signupAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password/:token', adminController.resetPassword);

// Protected routes (require admin authentication)
router.get('/dashboard', adminAuthMiddleware, adminController.getDashboard);
router.get('/users', adminAuthMiddleware, adminController.getAllUsers);
router.put('/users/:userId', adminAuthMiddleware, adminController.editUser);
router.put('/users/:userId/ban', adminAuthMiddleware, adminController.toggleBanUser);
router.delete('/users/:userId', adminAuthMiddleware, adminController.deleteUser);

module.exports = router;
