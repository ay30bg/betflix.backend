const express = require('express');
const router = express.Router();
const {
  getCurrentRound,
  preGenerateRound,
  setRoundOutcome,
  getAllRounds,
} = require('../controllers/roundController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const { body, param, validationResult } = require('express-validator');

// Public route
router.get('/current', getCurrentRound);

// Admin routes
router.get('/', authMiddleware, adminAuthMiddleware, getAllRounds);
router.post(
  '/pre-generate',
  // authMiddleware,
  // adminAuthMiddleware,
  [body('period').matches(/^round-\d+$/).withMessage('Invalid period format')],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    preGenerateRound(req, res, next);
  }
);
router.post(
  '/:period/outcome',
  authMiddleware,
  adminAuthMiddleware,
  [
    param('period').matches(/^round-\d+$/).withMessage('Invalid period format'),
    body('resultNumber').isInt({ min: 0, max: 9 }).withMessage('Result number must be between 0 and 9'),
    body('resultColor').isIn(['Green', 'Red']).withMessage('Invalid result color'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    setRoundOutcome(req, res, next);
  }
);

module.exports = router;
