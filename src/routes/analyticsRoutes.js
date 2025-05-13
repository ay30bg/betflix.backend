const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } = require('date-fns');

// Existing total-users endpoint
router.get('/total-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ status: 'active' });
    res.json({ totalUsers });
  } catch (error) {
    console.error('Error fetching total users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// New registrations endpoint
router.get('/registrations/:timeRange', async (req, res) => {
  try {
    const { timeRange } = req.params;
    let startDate, groupBy, format;

    // Determine time range and grouping
    switch (timeRange) {
      case '7d':
        startDate = subDays(new Date(), 7);
        groupBy = { $dayOfMonth: '$createdAt' };
        format = 'yyyy-MM-dd';
        break;
      case '30d':
        startDate = subWeeks(new Date(), 4);
        groupBy = { $week: '$createdAt' };
        format = 'yyyy-MM-W';
        break;
      case '90d':
        startDate = subMonths(new Date(), 3);
        groupBy = { $month: '$createdAt' };
        format = 'yyyy-MM';
        break;
      default:
        return res.status(400).json({ error: 'Invalid time range' });
    }

    // Aggregate user registrations
    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'active', // Optional: only count active users
        },
      },
      {
        $group: {
          _id: groupBy,
          date: { $first: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $project: {
          _id: 0,
          date: { $dateToString: { format: format, date: '$date' } },
          count: 1,
        },
      },
    ]);

    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
