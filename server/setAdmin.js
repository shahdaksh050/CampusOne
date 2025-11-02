const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateOne(
      { email: 'admin@gmail.com' },
      { $set: { role: 'teacher' } }
    );

    if (result.matchedCount === 0) {
      console.log('User with email admin@gmail.com not found');
    } else {
      console.log('✅ User admin@gmail.com promoted to teacher role');
    }

    const user = await User.findOne({ email: 'admin@gmail.com' });
    if (user) {
      console.log('Current user details:', {
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      });
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setAdmin();
