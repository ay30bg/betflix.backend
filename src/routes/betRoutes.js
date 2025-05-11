// const express = require('express');
// const router = express.Router();
// const { getBetHistory, getBetStats, placeBet, getCurrentRound, getBetResult } = require('../controllers/betController');
// const authMiddleware = require('../middleware/auth');

// router.get('/history', authMiddleware, getBetHistory);
// router.get('/stats', authMiddleware, getBetStats);
// router.post('/', authMiddleware, placeBet);
// router.get('/current', authMiddleware, getCurrentRound);
// router.get('/result/:period', authMiddleware, getBetResult);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { getBetHistory, getBetStats, placeBet, getCurrentRound, getBetResult, preGenerateRound, cleanupInvalidBets, setRoundOutcome } = require('../controllers/betController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const { body, param, validationResult } = require('express-validator');

router.get('/history', authMiddleware, getBetHistory);
router.get('/stats', authMiddleware, getBetStats);
router.post('/', authMiddleware, placeBet);
router.get('/current', authMiddleware, getCurrentRound);
router.get('/result/:period', authMiddleware, getBetResult);
router.post('/pre-generate-round', authMiddleware, preGenerateRound);
router.delete('/cleanup', authMiddleware, cleanupInvalidBets);

router.post(
  '/:period/set-outcome',
  adminAuthMiddleware,
  [
    param('period').notEmpty().withMessage('Period is required'),
    body('resultNumber').isInt({ min: 0, max: 9 }).withMessage('Result number must be between 0 and 9'),
    body('resultColor').isIn(['Green', 'Red']).withMessage('Invalid result color'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    setRoundOutcome(req, res, next);
  }
);

module.exports = router;
