const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes here require auth
router.use(authenticateToken);

// List conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const uid = req.user.firebaseUid;
    const conversations = await Conversation.find({ participants: uid }).sort({ lastMessageAt: -1 }).lean();
    // Optionally attach lastMessage preview
    const convIds = conversations.map(c => c._id);
    const lastMessages = await Message.aggregate([
      { $match: { conversationId: { $in: convIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$conversationId', content: { $first: '$content' }, timestamp: { $first: '$timestamp' } } }
    ]);
    const lastMap = new Map(lastMessages.map(m => [String(m._id), m]));
    const enriched = conversations.map(c => ({
      ...c,
      lastMessage: lastMap.get(String(c._id)) || null,
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const convId = req.params.id;
    const msgs = await Message.find({ conversationId: convId }).sort({ timestamp: 1 }).lean();
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create conversation (teacher only)
router.post('/conversations', authorizeRole('teacher'), async (req, res) => {
  try {
    let { participants = [], participantsEmails = [], type = 'group', name = '' } = req.body;
    // Normalize inputs
    participants = Array.isArray(participants) ? participants : [];
    participantsEmails = Array.isArray(participantsEmails) ? participantsEmails : [];

    // If emails provided, resolve to firebaseUids from User collection
    if (participantsEmails.length) {
      const users = await User.find({ email: { $in: participantsEmails } }, 'firebaseUid').lean();
      const resolved = users.map(u => u.firebaseUid).filter(Boolean);
      participants.push(...resolved);
    }

    // Ensure current user is a participant at minimum
    const uid = req.user.firebaseUid;
    if (!participants.includes(uid)) participants.push(uid);

    // Deduplicate and validate
    participants = Array.from(new Set(participants)).filter(Boolean);
    if (!participants.length) return res.status(400).json({ message: 'Participants required' });

    const conv = await Conversation.create({ participants, type, name });
    res.status(201).json(conv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Send message via REST (socket server will emit)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const convId = req.params.id;
    const { content = '', type = 'text', fileUrl = '', fileName = '' } = req.body;
    const msg = await Message.create({ conversationId: convId, senderUid: req.user.firebaseUid, content, type, fileUrl, fileName });
    await Conversation.findByIdAndUpdate(convId, { $set: { lastMessageAt: new Date() } });
    // Notify socket layer via in-memory event (server.js will set up io and listen if necessary)
    req.app.get('io')?.to(convId).emit('receiveMessage', { conversationId: convId, ...msg.toObject() });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
