const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.user = decoded;
    console.log('[Auth] Token verified - userId:', decoded.userId, 'companyId:', decoded.companyId);
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const generateToken = (userId, companyId) => {
  console.log('[Auth] Generating token for userId:', userId, 'companyId:', companyId);
  return jwt.sign(
    { userId, companyId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

module.exports = { verifyToken, generateToken };
