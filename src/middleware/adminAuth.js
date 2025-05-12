// const jwt = require('jsonwebtoken');

// const adminAuthMiddleware = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== 'admin') {
//       return res.status(403).json({ error: 'Access denied: Admins only' });
//     }
//     req.admin = { id: decoded.adminId, role: decoded.role }; // Attach admin data
//     next();
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid or expired token' });
//   }
// };

// module.exports = adminAuthMiddleware;

const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminAuthMiddleware = (req, res, next) => {
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Extract token from Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Invalid or missing Authorization header', {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      console.error('Access denied: Not an admin', {
        userId: decoded.id,
        role: decoded.role,
        path: req.path,
      });
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    // Attach admin data to request
    req.admin = decoded;
    console.log('Admin authenticated', {
      adminId: decoded.id,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    next();
  } catch (err) {
    console.error('Token verification error', {
      error: err.message,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = adminAuthMiddleware;
