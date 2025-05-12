const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    req.admin = { id: decoded.adminId, role: decoded.role }; // Attach admin data
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = adminAuthMiddleware;

// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const adminAuthMiddleware = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');

//   if (!token) {
//     console.error('No token provided');
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== 'admin') {
//       console.error('Access denied: Not an admin', { userId: decoded.id, role: decoded.role });
//       return res.status(403).json({ error: 'Access denied' });
//     }
//     req.admin = decoded;
//     console.log('Admin authenticated:', { adminId: decoded.id });
//     next();
//   } catch (err) {
//     console.error('Token verification error:', err.message);
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// module.exports = adminAuthMiddleware;
