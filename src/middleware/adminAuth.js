// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const adminAuthMiddleware = (req, res, next) => {
//   // Check if JWT_SECRET is set
//   if (!process.env.JWT_SECRET) {
//     console.error('JWT_SECRET is not defined in environment variables');
//     return res.status(500).json({ error: 'Server configuration error' });
//   }

//   // Extract token from Authorization header
//   const authHeader = req.header('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error('Invalid or missing Authorization header', {
//       path: req.path,
//       method: req.method,
//     });
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   const token = authHeader.replace('Bearer ', '');

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== 'admin') {
//       console.error('Access denied: Not an admin', {
//         userId: decoded.id,
//         role: decoded.role,
//         path: req.path,
//       });
//       return res.status(403).json({ error: 'Access denied: Admins only' });
//     }

//     // Attach admin data to request
//     req.admin = decoded;
//     console.log('Admin authenticated', {
//       adminId: decoded.id,
//       path: req.path,
//       timestamp: new Date().toISOString(),
//     });
//     next();
//   } catch (err) {
//     console.error('Token verification error', {
//       error: err.message,
//       path: req.path,
//       method: req.method,
//     });
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }
// };

// module.exports = adminAuthMiddleware;

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Adjust path as needed
require('dotenv').config();

const adminAuthMiddleware = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Invalid or missing Authorization header', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate payload
    if (!decoded.id || typeof decoded.id !== 'string' || !decoded.role || decoded.role !== 'admin') {
      console.error('Invalid JWT payload or role', {
        payload: decoded,
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Verify admin exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      console.error('Admin not found', {
        adminId: decoded.id,
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Admin account not found' });
    }

    req.admin = decoded;
    console.log('Admin authenticated', {
      adminId: decoded.id,
      path: req.path,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next();
  } catch (err) {
    console.error('Token verification error', {
      error: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please log in again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = adminAuthMiddleware;
