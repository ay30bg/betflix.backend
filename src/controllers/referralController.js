const Referral = require('../models/Referral');

// Function to generate an 8-digit numeric code
const generateReferralCode = async () => {
  const min = 10000000; // 00000000
  const max = 99999999; // 99999999
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(Math.random() * (max - min + 1)) + min;
    // Pad with leading zeros if needed to ensure 8digits
    code = code.toString().padStart(8, '0');
    // Check if code already exists
    const existingReferral = await Referral.findOne({ code });
    if (!existingReferral) {
      isUnique = true;
    }
  }

  return code;
};

const getReferralLink = async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrerId: req.user.id });

    if (!referral) {
      const code = await generateReferralCode();
      referral = await Referral.create({
        referrerId: req.user.id,
        code,
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/sign-up?ref=${referral.code}`;

    res.json({ referralLink });
  } catch (err) {
    console.error('Error generating referral link:', err);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
};

module.exports = { getReferralLink };
