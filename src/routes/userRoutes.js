// // src/routes/userRoutes.js
// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/auth');
// const userController = require('../controllers/userController');

// router.get('/profile', authMiddleware, userController.getProfile);
// router.put('/profile', authMiddleware, userController.updateProfile);

// module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

// Debug imports
console.log('authMiddleware:', typeof authMiddleware);
console.log('userController.setWithdrawalPassword:', typeof userController.setWithdrawalPassword);

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/set-withdrawal-password', authMiddleware, userController.setWithdrawalPassword);

module.exports = router;
