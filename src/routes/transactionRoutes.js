const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth'); // Changed from authMiddleware to auth

router.post('/crypto-deposit', authMiddleware, transactionController.initiateCryptoDeposit);
router.post('/crypto-withdrawal', authMiddleware, transactionController.initiateCryptoWithdrawal);
router.post('/webhook', transactionController.handleWebhook);

module.exports = router;
