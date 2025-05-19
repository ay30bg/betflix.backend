// routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages, createMessage, addReply } = require('../controllers/supportController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Get messages
router.get('/', [authMiddleware, adminAuthMiddleware], getMessages);

// Create a new message
router.post('/', authMiddleware, createMessage);

// Add a reply
router.post('/:id/reply', [authMiddleware, adminAuthMiddleware], addReply);

module.exports = router;
