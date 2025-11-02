const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Course = require('../models/Course');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { syncCourseConversation } = require('../utils/courseConversation');

// All routes here require auth
router.use(authenticateToken);

// List conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const uid = req.user.firebaseUid;
    
    // Check if user is admin - only admins can see ALL conversations
    const currentUser = await User.findOne({ firebaseUid: uid });
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // If admin, get ALL conversations. Otherwise, only their own
    const conversations = isAdmin
      ? await Conversation.find({})
          .sort({ lastMessageAt: -1 })
          .lean()
      : await Conversation.find({ participants: uid })
          .sort({ lastMessageAt: -1 })
          .lean();

    const conversationIds = conversations.map((conv) => conv._id);

    const lastMessages = conversationIds.length
      ? await Message.aggregate([
          { $match: { conversationId: { $in: conversationIds } } },
          { $sort: { timestamp: -1 } },
          {
            $group: {
              _id: '$conversationId',
              content: { $first: '$content' },
              timestamp: { $first: '$timestamp' },
              senderUid: { $first: '$senderUid' },
              type: { $first: '$type' },
              fileUrl: { $first: '$fileUrl' },
              fileName: { $first: '$fileName' },
            },
          },
        ])
      : [];

    const lastMessageMap = new Map(lastMessages.map((entry) => [String(entry._id), entry]));

    const participantUids = new Set();
    conversations.forEach(({ participants }) => participants.forEach((p) => participantUids.add(p)));
    lastMessages.forEach(({ senderUid }) => senderUid && participantUids.add(senderUid));

    const users = participantUids.size
      ? await User.find({ firebaseUid: { $in: Array.from(participantUids) } }, 'firebaseUid name firstName lastName role').lean()
      : [];
    const userMap = new Map(
      users.map((user) => [
        user.firebaseUid,
        {
          uid: user.firebaseUid,
          name: user.name?.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User',
          role: user.role || null,
        },
      ])
    );

    const fallbackGradients = [
      ['#06b6d4', '#3b82f6'],
      ['#6366f1', '#8b5cf6'],
      ['#ec4899', '#f97316'],
      ['#10b981', '#22d3ee'],
      ['#f59e0b', '#f97316'],
    ];

    const result = conversations.map((conversation) => {
      const lastMessage = lastMessageMap.get(String(conversation._id));

      const participantDetails = conversation.participants.map((participantUid) => {
        const userDetails = userMap.get(participantUid);
        return (
          userDetails || {
            uid: participantUid,
            name: 'Unknown participant',
            role: null,
          }
        );
      });

      let title = conversation.name?.trim();
      if (!title) {
        const otherParticipants = participantDetails.filter((p) => p.uid !== uid).map((p) => p.name).filter(Boolean);
        if (conversation.type === 'group' || otherParticipants.length > 1) {
          title = otherParticipants.join(', ') || 'Group conversation';
        } else {
          title = otherParticipants[0] || 'Private conversation';
        }
      }

      const description = conversation.description?.trim() || '';
      const previewContent = lastMessage?.content || description;

      const fallbackIndex = Math.abs(title.charCodeAt(0) || 0) % fallbackGradients.length;
      const [fallbackStart, fallbackEnd] = fallbackGradients[fallbackIndex];

      const groupInfo =
        conversation.groupInfo?.trim() ||
        (conversation.type !== 'private'
          ? `${conversation.participants.length} member${conversation.participants.length === 1 ? '' : 's'}`
          : '');

      return {
        _id: conversation._id,
        type: conversation.type,
        participants: participantDetails,
        title,
        description,
        courseTag: conversation.courseTag || null,
        groupInfo: groupInfo || null,
        avatarColor: conversation.avatarColor || fallbackStart,
        avatarColor2: conversation.avatarColor2 || fallbackEnd,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              timestamp: lastMessage.timestamp,
              type: lastMessage.type,
              fileUrl: lastMessage.fileUrl,
              fileName: lastMessage.fileName,
              sender: userMap.get(lastMessage.senderUid) || {
                uid: lastMessage.senderUid,
                name: 'Unknown participant',
              },
            }
          : null,
        preview: previewContent,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        unreadCount: 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch conversations', err);
    res.status(500).json({ message: err.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const convId = req.params.id;
    const uid = req.user.firebaseUid;
    
    // Check if user has access to this conversation
    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is admin (can see all) or is a participant
    const currentUser = await User.findOne({ firebaseUid: uid });
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isParticipant = conversation.participants.includes(uid);
    
    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    const messages = await Message.find({ conversationId: convId }).sort({ timestamp: 1 }).lean();

    const senderUids = [...new Set(messages.map((msg) => msg.senderUid).filter(Boolean))];
    const senders = senderUids.length
      ? await User.find({ firebaseUid: { $in: senderUids } }, 'firebaseUid name firstName lastName role').lean()
      : [];
    const senderMap = new Map(
      senders.map((user) => [
        user.firebaseUid,
        {
          uid: user.firebaseUid,
          name: user.name?.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User',
          role: user.role || null,
        },
      ])
    );

    const enrichedMessages = messages.map((msg) => ({
      _id: msg._id,
      conversationId: msg.conversationId,
      senderUid: msg.senderUid,
      sender: senderMap.get(msg.senderUid) || {
        uid: msg.senderUid,
        name: 'Unknown participant',
      },
      content: msg.content,
      type: msg.type,
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null,
      createdAt: msg.timestamp,
      timestamp: msg.timestamp,
    }));

    res.json(enrichedMessages);
  } catch (err) {
    console.error('Failed to fetch messages', err);
    res.status(500).json({ message: err.message });
  }
});

// Create conversation (teacher only)
router.post('/conversations', authorizeRole('teacher'), async (req, res) => {
  try {
    let { participants = [], participantsEmails = [], type = 'group', name = '', description = '', courseId = null } = req.body;
    
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

    // If courseId provided, sync course conversation instead
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      
      const conversation = await syncCourseConversation(courseId);
      return res.status(201).json(conversation);
    }

    const conv = await Conversation.create({ 
      participants, 
      type, 
      name,
      description,
      groupInfo: `${participants.length} member${participants.length === 1 ? '' : 's'}`
    });
    
    res.status(201).json(conv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Sync all course conversations (teacher only) - useful for batch updates
router.post('/conversations/sync-courses', authorizeRole('teacher'), async (req, res) => {
  try {
    const courses = await Course.find({ status: 'Active' });
    const results = [];
    
    for (const course of courses) {
      try {
        const conversation = await syncCourseConversation(course._id);
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          conversationId: conversation?._id,
          status: 'success'
        });
      } catch (error) {
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    res.json({ 
      message: 'Course conversations synced', 
      total: courses.length,
      results 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message via REST (socket server will emit)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const convId = req.params.id;
    const { content = '', type = 'text', fileUrl = '', fileName = '' } = req.body;
    const senderUid = req.user.firebaseUid;
    const msg = await Message.create({ conversationId: convId, senderUid, content, type, fileUrl, fileName });
    await Conversation.findByIdAndUpdate(convId, { $set: { lastMessageAt: new Date() } });

    const sender = await User.findOne({ firebaseUid: senderUid }, 'firebaseUid name firstName lastName role').lean();
    const senderPayload = sender
      ? {
          uid: sender.firebaseUid,
          name: sender.name?.trim() || `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unnamed User',
          role: sender.role || null,
        }
      : {
          uid: senderUid,
          name: 'Unknown participant',
        };

    const normalized = {
      _id: msg._id,
      conversationId: msg.conversationId,
      senderUid: msg.senderUid,
      sender: senderPayload,
      content: msg.content,
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      createdAt: msg.timestamp,
      timestamp: msg.timestamp,
    };

    req.app.get('io')?.to(convId).emit('receiveMessage', normalized);
    res.status(201).json(normalized);
  } catch (err) {
    console.error('Failed to send message', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
