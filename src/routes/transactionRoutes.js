const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getBetHistory, getBetStats } = require('../controllers/betController');

router.get('/history', authMiddleware, getBetHistory);
router.get('/stats', authMiddleware, getBetStats);

module.exports = router;