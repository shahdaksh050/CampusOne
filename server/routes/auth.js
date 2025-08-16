const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');

// POST /api/auth/register
// Body: { email, password, firstName?, lastName? }
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName = '', lastName = '' } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Auth service unavailable. Check Firebase Admin configuration.' });
    }

    // Create Firebase user
    const fbUser = await admin.auth().createUser({ email, password });

    // Create MongoDB user with default role 'student' and optional names
    const user = await User.create({ firebaseUid: fbUser.uid, email, role: 'student', firstName, lastName });

    return res.status(201).json({ message: 'User registered', email: user.email, role: user.role, firstName: user.firstName || '', lastName: user.lastName || '' });
  } catch (err) {
    console.error('Register error:', err);
    const code = err?.code || '';
    if (code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    if (code === 'auth/invalid-password') {
      return res.status(400).json({ message: 'Invalid password' });
    }
    return res.status(400).json({ message: err?.message || 'Registration failed' });
  }
});

// POST /api/auth/login
// Body: { idToken }
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });
    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Auth service unavailable. Check Firebase Admin configuration.' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      // If user exists in Firebase but not in DB, create with default role
      user = await User.create({ firebaseUid, email: decoded.email || '', role: 'student' });
    }

    return res.json({ email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
