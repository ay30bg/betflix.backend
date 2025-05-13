const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;

// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const authMiddleware = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     if (!user.isVerified) {
//       return res.status(403).json({ error: 'Please verify your email' });
//     }
//     if (user.status === 'banned') {
//       return res.status(403).json({ error: 'Account is banned' });
//     }
//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };

// router.get('/profile', authMiddleware, (req, res) => {
//   res.json({
//     id: req.user._id,
//     username: req.user.username,
//     email: req.user.email,
//     balance: req.user.balance,
//     status: req.user.status,
//   });
// });

// module.exports = router;
