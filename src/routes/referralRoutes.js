const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getReferralLink } = require('../controllers/referralController');

router.get('/link', authMiddleware, getReferralLink);

module.exports = router;