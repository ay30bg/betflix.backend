require('dotenv').config();

module.exports = {
  apiKey: process.env.NOWPAYMENTS_API_KEY,
  baseUrl: 'https://api.nowpayments.io/v1',
  webhookSecret: process.env.NOWPAYMENTS_WEBHOOK_SECRET,
  email: process.env.NOWPAYMENTS_EMAIL ,
  password: process.env.NOWPAYMENTS_PASSWORD
};
