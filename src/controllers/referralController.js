// const Referral = require('../models/Referral');

// // Function to generate an 8-digit numeric code
// const generateReferralCode = async () => {
//   const min = 10000000; // 00000000
//   const max = 99999999; // 99999999
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = Math.floor(Math.random() * (max - min + 1)) + min;
//     // Pad with leading zeros if needed to ensure 8digits
//     code = code.toString().padStart(8, '0');
//     // Check if code already exists
//     const existingReferral = await Referral.findOne({ code });
//     if (!existingReferral) {
//       isUnique = true;
//     }
//   }

//   return code;
// };

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

// module.exports = { getReferralLink };


const Referral = require('../models/Referral');

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

const getReferralLink = async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrerId: req.user.userId });

    if (!referral) {
      const code = await generateReferralCode();
      referral = await Referral.create({
        referrerId: req.user.userId,
        code,
        referredUsers: [],
        rewardsEarned: 0,
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

const getReferralStats = async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrerId: req.user.userId }).populate(
      'referredUsers.userId',
      'username email createdAt'
    );

    if (!referral) {
      return res.json({
        totalReferrals: 0,
        rewardsEarned: 0,
        referredUsers: [],
      });
    }

    const stats = {
      totalReferrals: referral.referredUsers.length,
      rewardsEarned: referral.rewardsEarned || 0,
      referredUsers: referral.referredUsers.map((entry) => ({
        username: entry.userId?.username || 'Unknown',
        email: entry.userId?.email || 'N/A',
        joinedAt: entry.joinedAt || entry.userId?.createdAt,
      })),
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching referral stats:', err);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
};

module.exports = { getReferralLink, getReferralStats };
