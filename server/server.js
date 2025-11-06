const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ) {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } else {
      console.warn('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS or individual env vars.');
    }
  }
} catch (e) {
  console.error('Failed to initialize Firebase Admin SDK:', e);
}

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const { authenticateToken } = require('./middleware/auth');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*'} });
app.set('io', io);

// If REDIS_URL is provided, configure the Socket.IO Redis adapter so the socket
// layer can scale across multiple instances. This is optional and only runs
// when REDIS_URL exists in the environment.
if (process.env.REDIS_URL) {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');

    (async () => {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter configured');
    })();
  } catch (err) {
    console.error('Failed to configure Redis adapter for Socket.IO:', err);
  }
}

io.on('connection', (socket) => {
  socket.on('joinConversation', ({ conversationId }) => {
    if (conversationId) socket.join(conversationId);
  });
  socket.on('sendMessage', (payload) => {
    if (payload?.conversationId) {
      io.to(payload.conversationId).emit('receiveMessage', payload);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusone')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected profile routes
app.use('/api/users', userRoutes);

// Protected data routes
app.use('/api/courses', authenticateToken, courseRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/timetable', authenticateToken, timetableRoutes);
app.use('/api', messageRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from the React app (production build)
const distPath = path.join(__dirname, '../dist');
const hasFrontendBuild = fs.existsSync(path.join(distPath, 'index.html'));
if (hasFrontendBuild) {
  app.use(express.static(distPath));
} else {
  console.warn(`Frontend build not found at ${path.join(distPath, 'index.html')}. Serving API only.`);
}

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    if (hasFrontendBuild) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(503).send('Frontend build not found. Please try again in a minute while the build completes.');
    }
  } else {
    res.status(404).json({ message: 'API route not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
