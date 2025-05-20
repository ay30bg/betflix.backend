// // controllers/referralController.js
// const Referral = require('../models/Referral');
// const User = require('../models/User');

// // Function to generate an 8-digit numeric code (unchanged)
// const generateReferralCode = async () => {
//   const min = 10000000; // 00000000
//   const max = 99999999; // 99999999
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = Math.floor(Math.random() * (max - min + 1)) + min;
//     code = code.toString().padStart(8, '0');
//     const existingReferral = await Referral.findOne({ code });
//     if (!existingReferral) {
//       isUnique = true;
//     }
//   }

//   return code;
// };

// // Get referral link (unchanged)
// const getReferralLink = async (req, res) => {
//   try {
//     let referral = await Referral.findOne({ referrerId: req.user.id });

//     if (!referral) {
//       const code = await generateReferralCode();
//       referral = await Referral.create({
//         referrerId: req.user.id,
//         code,
//       });
//     }

//     const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
//     const referralLink = `${baseUrl}/sign-up?ref=${referral.code}`;

//     res.json({ referralLink });
//   } catch (err) {
//     console.error('Error generating referral link:', err);
//     res.status(500).json({ error: 'Failed to generate referral link' });
//   }
// };

// // Get referral statistics
// const getReferralStats = async (req, res) => {
//   try {
//     const referral = await Referral.findOne({ referrerId: req.user.id })
//       .populate('referredUsers', 'username createdAt');

//     if (!referral) {
//       return res.json({
//         totalReferrals: 0,
//         totalBonus: 0,
//         availableBonus: 0,
//         referrals: [],
//       });
//     }

//     const referralStats = {
//       totalReferrals: referral.referredUsers.length,
//       totalBonus: referral.totalBonus || 0,
//       availableBonus: referral.availableBonus || 0,
//       referrals: referral.referredUsers.map((user) => ({
//         id: user._id,
//         username: user.username || 'N/A',
//         signupDate: user.createdAt,
//         bonusEarned: 10, // Example: Fixed $10 per referral; adjust as needed
//       })),
//     };

//     res.json(referralStats);
//   } catch (err) {
//     console.error('Error fetching referral stats:', err);
//     res.status(500).json({ error: 'Server error while fetching referral stats' });
//   }
// };

// // Withdraw referral bonus
// const withdrawReferralBonus = async (req, res) => {
//   try {
//     const referral = await Referral.findOne({ referrerId: req.user.id });
//     if (!referral) {
//       return res.status(404).json({ error: 'Referral data not found' });
//     }

//     const availableBonus = referral.availableBonus || 0;
//     if (availableBonus <= 0) {
//       return res.status(400).json({ error: 'No available bonus to withdraw' });
//     }

//     // Update user's balance
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     user.balance = (user.balance || 0) + availableBonus;
//     referral.availableBonus = 0;

//     await Promise.all([user.save(), referral.save()]);

//     res.json({
//       message: 'Referral bonus withdrawn successfully',
//       balance: user.balance,
//     });
//   } catch (err) {
//     console.error('Error withdrawing referral bonus:', err);
//     res.status(500).json({ error: 'Server error while withdrawing bonus' });
//   }
// };

// module.exports = { getReferralLink, getReferralStats, withdrawReferralBonus };

// controllers/referralController.js
const Referral = require('../models/Referral');
const User = require('../models/User');

// Function to generate an 8-digit numeric code
const generateReferralCode = async () => {
  const min = 10000000; // 00000000
  const max = 99999999; // 99999999
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(Math.random() * (max - min + 1)) + min;
    code = code.toString().padStart(8, '0');
    const existingReferral = await Referral.findOne({ code });
    if (!existingReferral) {
      isUnique = true;
    }
  }

  return code;
};

// Get referral link
const getReferralLink = async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrerId: req.user.userId }); // Changed from req.user.id

    if (!referral) {
      const code = await generateReferralCode();
      referral = await Referral.create({
        referrerId: req.user.userId,
        code,
        referredUsers: [],
        totalBonus: 0,
        availableBonus: 0,
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://betflix-one.vercel.app';
    const referralLink = `${baseUrl}/sign-up?ref=${referral.code}`;

    res.json({ referralLink });
  } catch (err) {
    console.error('Error generating referral link:', err);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
};

// Get referral statistics
const getReferralStats = async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrerId: req.user.userId }) // Changed from req.user.id
      .populate('referredUsers.userId', 'username createdAt');

    if (!referral) {
      return res.json({
        totalReferrals: 0,
        totalBonus: 0,
        availableBonus: 0,
        referrals: [],
      });
    }

    const referralStats = {
      totalReferrals: referral.referredUsers.length,
      totalBonus: referral.totalBonus || 0,
      availableBonus: referral.availableBonus || 0,
      referrals: referral.referredUsers.map((entry) => ({
        id: entry.userId._id,
        username: entry.userId.username || 'N/A',
        signupDate: entry.userId.createdAt,
        bonusEarned: entry.bonusEarned || 0, // Dynamic based on deposits
      })),
    };

    res.json(referralStats);
  } catch (err) {
    console.error('Error fetching referral stats:', err);
    res.status(500).json({ error: 'Server error while fetching referral stats' });
  }
};

// Withdraw referral bonus
const withdrawReferralBonus = async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrerId: req.user.userId }); // Changed from req.user.id
    if (!referral) {
      return res.status(404).json({ error: 'Referral data not found' });
    }

    const availableBonus = referral.availableBonus || 0;
    if (availableBonus <= 0) {
      return res.status(400).json({ error: 'No available bonus to withdraw' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.balance = (user.balance || 0) + availableBonus;
    referral.availableBonus = 0;

    await Promise.all([user.save(), referral.save()]);

    res.json({
      message: 'Referral bonus withdrawn successfully',
      balance: user.balance,
    });
  } catch (err) {
    console.error('Error withdrawing referral bonus:', err);
    res.status(500).json({ error: 'Server error while withdrawing bonus' });
  }
};

module.exports = { getReferralLink, getReferralStats, withdrawReferralBonus };
