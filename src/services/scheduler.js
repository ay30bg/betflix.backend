// scheduler.js
const cron = require('node-cron');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'; // Set in .env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yourpassword'; // Set in .env
const JWT_SECRET = process.env.JWT_SECRET; // Required for token verification
const BASE_URL = process.env.BASE_URL || 'http://betflix-one.vercel.app'; // Set in .env or default to localhost

// Validate environment variables
if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in environment variables');
  throw new Error('JWT_SECRET is required');
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ADMIN_EMAIL or ADMIN_PASSWORD is not defined in environment variables');
  throw new Error('Admin credentials are required');
}

// Store admin token
let adminToken = null;

// Function to get or refresh admin token
const getAdminToken = async () => {
  try {
    if (!adminToken) {
      console.log('Fetching new admin token');
      const response = await axios.post(`${BASE_URL}/admin/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      adminToken = response.data.token;
      console.log('Admin token obtained:', { email: ADMIN_EMAIL });
    }
    // Verify token is still valid
    jwt.verify(adminToken, JWT_SECRET);
    return adminToken;
  } catch (err) {
    console.error('Error getting admin token:', {
      message: err.message,
      response: err.response?.data,
    });
    adminToken = null; // Reset token on error
    throw err;
  }
};

// Function to create a round
const createRound = async () => {
  try {
    const token = await getAdminToken();
    const response = await axios.post(
      `${BASE_URL}/admin/rounds`,
      {}, // Empty body to create next round
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Scheduled round created:', {
      period: response.data.round.period,
      resultNumber: response.data.round.resultNumber,
      resultColor: response.data.round.resultColor,
    });
  } catch (err) {
    console.error('Error creating scheduled round:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    if (err.response?.status === 401 || err.response?.status === 403) {
      adminToken = null; // Force token refresh on auth errors
    }
  }
};

// Schedule round creation every 2 minutes
cron.schedule('0 */2 * * * *', () => {
  console.log('Running scheduled round creation at', new Date().toISOString());
  createRound();
});

// Initial run to create a round immediately
console.log('Initializing scheduler with initial round creation');
createRound();

// Export start function for integration
module.exports = {
  start: () => console.log('Round creation scheduler started'),
};
