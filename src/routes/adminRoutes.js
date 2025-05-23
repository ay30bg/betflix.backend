// const express = require('express');
// const router = express.Router();
// const adminController = require('../controllers/adminController');
// const adminAuthMiddleware = require('../middleware/adminAuth');

// // Public routes
// router.post('/signup', adminController.signupAdmin);
// router.post('/login', adminController.loginAdmin);
// router.post('/forgot-password', adminController.forgotPassword);
// router.post('/reset-password/:token', adminController.resetPassword);

// // Protected routes (require admin authentication)
// router.get('/dashboard', adminAuthMiddleware, adminController.getDashboard);
// router.get('/users', adminAuthMiddleware, adminController.getAllUsers);
// router.put('/users/:userId', adminAuthMiddleware, adminController.editUser);
// router.put('/users/:userId/ban', adminAuthMiddleware, adminController.toggleBanUser);
// router.delete('/users/:userId', adminAuthMiddleware, adminController.deleteUser);
// router.get('/withdrawal-requests', adminAuthMiddleware, adminController.getPendingWithdrawalRequests);
// router.post('/update-withdrawal', adminAuthMiddleware, adminController.updateWithdrawalRequest);
// router.get('/total-revenue', adminAuthMiddleware, adminController.getTotalRevenue); // New route

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
router.get('/withdrawal-requests', adminAuthMiddleware, adminController.getPendingWithdrawalRequests);
router.post('/update-withdrawal', adminAuthMiddleware, adminController.updateWithdrawalRequest);
router.get('/total-revenue', adminAuthMiddleware, adminController.getTotalRevenue);
router.get('/active-rounds', adminAuthMiddleware, adminController.getActiveRounds); // New route for active rounds

module.exports = router;
