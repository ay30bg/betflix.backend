// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/auth');
// const { getReferralLink } = require('../controllers/referralController');

// router.get('/link', authMiddleware, getReferralLink);

// module.exports = router;

// routes/referral.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getReferralLink, getReferralStats, withdrawReferralBonus } = require('../controllers/referralController');

router.get('/link', authMiddleware, getReferralLink);
router.get('/stats', authMiddleware, getReferralStats);
router.post('/withdraw-bonus', authMiddleware, withdrawReferralBonus);

module.exports = router;
