const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // firebaseUid(s)
  type: {
    type: String,
    enum: ['private', 'group', 'announcement', 'course'],
    default: 'private',
  },
  name: { type: String, trim: true },
  description: { type: String, trim: true },
  courseTag: { type: String, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Link to course
  groupInfo: { type: String, trim: true },
  avatarColor: { type: String, trim: true },
  avatarColor2: { type: String, trim: true },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

// Index for fast course-conversation lookup
conversationSchema.index({ courseId: 1 });
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
