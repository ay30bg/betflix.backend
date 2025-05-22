// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = { id: decoded.userId };
//     next();
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid or expired token' });
//   }
// };

// module.exports = authMiddleware;

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('Received Headers:', req.headers); // Log all headers
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  console.log('Authorization Header:', authHeader); // Log Authorization header

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header:', authHeader);
    return res.status(401).json({
      error: 'Authorization header is empty (Bearer JWTtoken is required)',
      details: { received: authHeader || 'none' },
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token extracted from Authorization header');
    return res.status(401).json({
      error: 'No token provided',
      details: { header: authHeader },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      details: err.message,
    });
  }
};

module.exports = authMiddleware;
