const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all users (authenticated users can see this for conversation creation)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'firebaseUid email name firstName lastName role')
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    
    const normalizedUsers = users.map(user => ({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'student'
    }));
    
    res.json(normalizedUsers);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get current user's profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      name: user.name || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update current user's profile (name only)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const { name, firstName, lastName } = req.body;
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof firstName === 'string') update.firstName = firstName;
    if (typeof lastName === 'string') update.lastName = lastName;
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: update },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      message: 'Profile updated',
      name: user.name || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Promote a user to admin (temporary route for initial setup)
// IMPORTANT: Remove this route in production or add proper admin authentication
router.post('/promote-admin', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'admin' } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      message: `User ${email} promoted to admin`,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
