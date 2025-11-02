const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderUid: { type: String, required: true },
  content: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
  fileUrl: { type: String, trim: true },
  fileName: { type: String, trim: true },
});

module.exports = mongoose.model('Message', messageSchema);
