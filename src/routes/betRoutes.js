const express = require('express');
const router = express.Router();
const {
  getBetHistory,
  getPendingBets,
  getBetStats,
  placeBet,
  getCurrentRound,
  getBetResult,
  preGenerateRound,
  cleanupInvalidBets,
  setRoundOutcome,
  getAllRounds,
  getRecentRounds,
} = require('../controllers/betController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error(`[${new Date().toISOString()}] Validation errors:`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/history', authMiddleware, getBetHistory);

router.get('/pending', authMiddleware, getPendingBets);

router.get('/stats', authMiddleware, getBetStats);

router.post(
  '/',
  authMiddleware,
  [
    body('type').isIn(['color', 'number']).withMessage('Invalid bet type'),
    body('value').notEmpty().withMessage('Value is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('clientSeed').isString().notEmpty().withMessage('Client seed is required'),
  ],
  validateRequest,
  placeBet
);

router.get('/current', authMiddleware, getCurrentRound);

router.get(
  '/result/:period',
  authMiddleware,
  [param('period').matches(/^round-\d+$/).withMessage('Invalid period format')],
  validateRequest,
  getBetResult
);

router.post(
  '/pre-generate-round',
  authMiddleware,
  [body('period').matches(/^round-\d+$/).withMessage('Invalid period format')],
  validateRequest,
  preGenerateRound
);

router.delete('/cleanup', authMiddleware, cleanupInvalidBets);

router.get('/rounds/history', authMiddleware, getAllRounds);

router.get('/rounds/recent', authMiddleware, getRecentRounds);

router.post(
  '/:period/set-outcome',
  adminAuthMiddleware,
  [
    param('period').matches(/^round-\d+$/).withMessage('Invalid period format'),
    body('resultNumber').isInt({ min: 0, max: 9 }).withMessage('Result number must be between 0 and 9'),
    body('resultColor').isIn(['Green', 'Red']).withMessage('Invalid result color'),
  ],
  validateRequest,
  setRoundOutcome
);

module.exports = router;
