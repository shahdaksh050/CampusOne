const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const aiConversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [aiMessageSchema],
  context: {
    studentInfo: mongoose.Schema.Types.Mixed,
    courseInfo: mongoose.Schema.Types.Mixed,
    attendanceInfo: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
aiConversationSchema.index({ userId: 1, createdAt: -1 });
aiConversationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
