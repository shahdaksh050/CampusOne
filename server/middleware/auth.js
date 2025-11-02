const admin = require('firebase-admin');
const User = require('../models/User');

// Verify Firebase ID token and attach user with role
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing Authorization token' });

    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUid = decoded.uid;
    const email = decoded.email || '';

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      // Create a default user record if missing
      user = await User.create({ firebaseUid, email, role: 'student' });
    }

    req.user = { firebaseUid, role: user.role, email: user.email };
    next();
  } catch (err) {
    console.error('authenticateToken error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Check required roles
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ message: 'Forbidden' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient role' });
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };
