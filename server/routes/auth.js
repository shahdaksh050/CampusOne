const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');
const Student = require('../models/Student');

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

    // Auto-create Student record for new student users
    try {
      // Generate unique student ID and roll number
      const timestamp = Date.now();
      const studentIdSuffix = email.split('@')[0].substring(0, 10); // Use part of email
      const studentId = `STU${timestamp}_${studentIdSuffix}`;
      const rollNumber = `ROLL${timestamp}`;

      await Student.create({
        studentId,
        rollNumber,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        email,
        firebaseUid: fbUser.uid,
        program: 'General Studies', // Default program
        year: 1,
        status: 'Active',
        courses: [],
        enrolledCourseIds: []
      });

      console.log(`✓ Created Student record for ${email}`);
    } catch (studentErr) {
      console.error('Failed to create Student record:', studentErr);
      // Don't fail registration if Student creation fails
      // The sync script can be run later to fix this
    }

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

    // Auto-create Student record if user is a student and doesn't have one
    if (user.role === 'student') {
      try {
        const existingStudent = await Student.findOne({ 
          $or: [
            { firebaseUid },
            { email: user.email }
          ]
        });

        if (!existingStudent) {
          const timestamp = Date.now();
          const studentIdSuffix = user.email.split('@')[0].substring(0, 10);
          const studentId = `STU${timestamp}_${studentIdSuffix}`;
          const rollNumber = `ROLL${timestamp}`;

          await Student.create({
            studentId,
            rollNumber,
            firstName: user.firstName || user.email.split('@')[0],
            lastName: user.lastName || '',
            email: user.email,
            firebaseUid,
            program: 'General Studies',
            year: 1,
            status: 'Active',
            courses: [],
            enrolledCourseIds: []
          });

          console.log(`✓ Auto-created Student record for ${user.email} on login`);
        } else if (!existingStudent.firebaseUid) {
          // Update existing student with firebaseUid if missing
          existingStudent.firebaseUid = firebaseUid;
          await existingStudent.save();
          console.log(`✓ Updated Student record with firebaseUid for ${user.email}`);
        }
      } catch (studentErr) {
        console.error('Failed to create/update Student record on login:', studentErr);
        // Don't fail login if Student creation fails
      }
    }

    return res.json({ email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
