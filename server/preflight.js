const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

const errors = [];

requiredEnv.forEach((name) => {
  if (!process.env[name]) errors.push(`Missing env var: ${name}`);
});

// Check FIREBASE_ADMIN_CREDENTIALS parseability
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  try {
    JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  } catch (e) {
    errors.push('FIREBASE_ADMIN_CREDENTIALS is present but is invalid JSON.');
  }
} else if (
  !process.env.FIREBASE_ADMIN_PROJECT_ID ||
  !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
  !process.env.FIREBASE_ADMIN_PRIVATE_KEY
) {
  errors.push('Firebase admin credentials not set. Provide FIREBASE_ADMIN_CREDENTIALS (JSON) or individual FIREBASE_ADMIN_* variables.');
}

// Quick MONGODB_URI format check
if (process.env.MONGODB_URI) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
      errors.push('MONGODB_URI does not look like a valid MongoDB connection string.');
    }
  } catch (e) {
    errors.push('Error validating MONGODB_URI: ' + e.message);
  }
}

if (errors.length) {
  console.error('Preflight failed with the following issues:');
  errors.forEach((e) => console.error('- ' + e));
  process.exitCode = 1;
} else {
  console.log('Preflight basic checks passed. Attempting short MongoDB connection (3s timeout)...');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusone';
  mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 }).then(() => {
    console.log('MongoDB connection successful.');
    mongoose.disconnect().then(() => process.exit(0));
  }).catch((err) => {
    console.error('MongoDB connection failed:', err.message || err);
    process.exitCode = 1;
  });
}
