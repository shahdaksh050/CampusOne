const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // firebaseUid(s)
  type: { type: String, enum: ['private', 'group', 'announcement'], default: 'private' },
  name: { type: String, trim: true },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversation', conversationSchema);
