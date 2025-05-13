const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET total users
router.get('/total-users', async (req, res) => {
  try {
    // Count only active users (optional: remove status filter to count all users)
    const totalUsers = await User.countDocuments({ status: 'active' });
    res.json({ totalUsers });
  } catch (error) {
    console.error('Error fetching total users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
