const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { getRoundResult } = require('../controllers/betController');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Public routes
router.post('/signup', adminController.signupAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password/:token', adminController.resetPassword);

// Protected routes (require admin authentication)
router.get('/dashboard', adminAuthMiddleware, adminController.getDashboard);
router.get('/users', adminAuthMiddleware, adminController.getAllUsers);
// router.get('/rounds/result/:period', authenticateAdminToken, getRoundResult);
router.put('/users/:userId', adminAuthMiddleware, adminController.editUser);
router.put('/users/:userId/ban', adminAuthMiddleware, adminController.toggleBanUser);
router.delete('/users/:userId', adminAuthMiddleware, adminController.deleteUser);

module.exports = router;

