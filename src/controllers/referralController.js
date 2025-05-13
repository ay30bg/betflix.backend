const Referral = require('../models/Referral');
const { v4: uuidv4 } = require('uuid');

const getReferralLink = async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrerId: req.user.id });

    if (!referral) {
      referral = await Referral.create({
        referrerId: req.user.id,
        code: uuidv4(),
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/sign-up?ref=${referral.code}`;

    res.json({ referralLink });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
};

module.exports = { getReferralLink };
