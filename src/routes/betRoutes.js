const express = require('express');
const router = express.Router();
const { getBetHistory, getBetStats, placeBet, getCurrentRound, getBetResult } = require('../controllers/betController');
const authMiddleware = require('../middleware/auth');

router.get('/history', authMiddleware, getBetHistory);
router.get('/stats', authMiddleware, getBetStats);
router.post('/', authMiddleware, placeBet);
router.get('/current', authMiddleware, getCurrentRound);
router.get('/result/:period', authMiddleware, getBetResult);

module.exports = router;
