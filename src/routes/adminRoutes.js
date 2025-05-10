const express = require('express');
const router = express.Router();
const { getDashboard, getAllUsers, deleteUser } = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Admin Dashboard
router.get('/dashboard', adminAuthMiddleware, getDashboard);

// Get All Users
router.get('/users', adminAuthMiddleware, getAllUsers);

// Delete User
router.delete('/users/:userId', adminAuthMiddleware, deleteUser);

module.exports = router;
