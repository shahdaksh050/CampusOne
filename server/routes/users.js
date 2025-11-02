const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router;
