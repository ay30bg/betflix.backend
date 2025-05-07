const User = require('../models/User');
const Referral = require('../models/Referral');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const signup = async (req, res) => {
  const { username, email, password, referralCode } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      balance: 1000, // Default balance as per frontend
    });

    // Handle referral
    if (referralCode) {
      const referral = await Referral.findOne({ code: referralCode });
      if (referral && !referral.referredUserId) {
        await Referral.updateOne(
          { code: referralCode },
          { referredUserId: user._id }
        );
        // Optionally reward referrer (e.g., add balance)
        await User.updateOne(
          { _id: referral.referrerId },
          { $inc: { balance: 50 } } // Example: $50 bonus
        );
      }
    }

    // Create referral code for new user
    await Referral.create({
      referrerId: user._id,
      code: uuidv4(),
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign up' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, balance: user.balance },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log in' });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = { signup, login, logout };