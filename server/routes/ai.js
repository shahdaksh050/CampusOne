const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIConversation = require('../models/AIConversation');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Note: Authentication is handled in server.js via authenticateToken middleware

// Get user context (student info, courses, attendance)
async function getUserContext(firebaseUid, userRole) {
  try {
    const context = {
      role: userRole,
      timestamp: new Date().toISOString()
    };

    if (userRole === 'student') {
      // Get student info
      const student = await Student.findOne({ firebaseUid })
        .populate('courses', 'title courseCode instructor')
        .lean();

      if (student) {
        context.student = {
          name: student.name || `${student.firstName} ${student.lastName}`,
          email: student.email,
          rollNumber: student.rollNumber,
          program: student.program,
          year: student.year,
          enrolledCourses: student.courses || []
        };

        // Get attendance stats
        const attendanceRecords = await Attendance.find({ student: student._id });
        const stats = {
          total: attendanceRecords.length,
          present: attendanceRecords.filter(r => r.status === 'Present').length,
          absent: attendanceRecords.filter(r => r.status === 'Absent').length,
          late: attendanceRecords.filter(r => r.status === 'Late').length
        };
        stats.attendanceRate = stats.total > 0 
          ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
          : 0;

        context.attendance = stats;
      }
    } else if (userRole === 'teacher' || userRole === 'admin') {
      // Get courses they teach
      const courses = await Course.find({ instructor: firebaseUid })
        .select('title courseCode schedule credits')
        .lean();
      
      context.courses = courses;
      
      // Get total students across their courses
      const totalStudents = await Student.countDocuments({ status: 'Active' });
      context.totalStudents = totalStudents;
    }

    return context;
  } catch (error) {
    console.error('Error getting user context:', error);
    return { role: userRole };
  }
}

// Generate system prompt based on user role and context
function generateSystemPrompt(context) {
  const basePrompt = `You are an AI assistant for CampusOne, a student management system. You are helpful, friendly, and knowledgeable about academic matters.

Current date and time: ${new Date().toLocaleString()}

`;

  if (context.role === 'student' && context.student) {
    return basePrompt + `You are assisting ${context.student.name}, a ${context.student.year} year student in the ${context.student.program} program.

Student Details:
- Email: ${context.student.email}
- Roll Number: ${context.student.rollNumber}
- Enrolled Courses: ${context.student.enrolledCourses.map(c => `${c.courseCode} - ${c.title}`).join(', ')}

Attendance Information:
- Overall Attendance Rate: ${context.attendance?.attendanceRate}%
- Total Classes: ${context.attendance?.total}
- Present: ${context.attendance?.present}
- Absent: ${context.attendance?.absent}
- Late: ${context.attendance?.late}

You can help with:
- Questions about their courses and schedule
- Attendance tracking and improvement tips
- Study recommendations
- General academic advice
- Navigation help for the CampusOne system

Be encouraging about their attendance and studies. If attendance is low, provide helpful suggestions.`;
  } else if (context.role === 'teacher') {
    return basePrompt + `You are assisting a teacher/instructor.

Teaching Information:
- Number of courses: ${context.courses?.length || 0}
- Courses: ${context.courses?.map(c => `${c.courseCode} - ${c.title}`).join(', ') || 'None'}
- Total students in system: ${context.totalStudents}

You can help with:
- Course management and planning
- Attendance tracking and analysis
- Student performance insights
- Grading and assessment strategies
- Communication with students

Provide professional, practical advice for educators.`;
  } else if (context.role === 'admin') {
    return basePrompt + `You are assisting an administrator.

System Information:
- Total students: ${context.totalStudents}
- Total courses: ${context.courses?.length || 0}

You can help with:
- System administration and user management
- Analytics and reporting
- Policy and procedure questions
- Technical support
- Strategic planning

Provide comprehensive administrative support and insights.`;
  }

  return basePrompt + 'You can help with general questions about the CampusOne system.';
}

// Get all conversations for the current user
router.get('/conversations', async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    
    const conversations = await AIConversation.find({ 
      userId: firebaseUid,
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .select('title messages updatedAt createdAt')
      .lean();

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific conversation
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const { conversationId } = req.params;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId: firebaseUid
    }).lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { firebaseUid, role } = req.user;
    const { title } = req.body;

    // Get user context
    const context = await getUserContext(firebaseUid, role);

    const conversation = await AIConversation.create({
      userId: firebaseUid,
      userRole: role,
      title: title || 'New Conversation',
      context: context,
      messages: []
    });

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Send a message and get AI response
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { firebaseUid, role } = req.user;
    const { conversationId } = req.params;
    const { message } = req.body;

    console.log('Received message request:', { conversationId, messageLength: message?.length, role });

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find conversation
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId: firebaseUid
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    console.log('Found conversation:', conversation._id, 'with', conversation.messages.length, 'messages');

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get fresh context
    console.log('Getting user context for role:', role);
    const context = await getUserContext(firebaseUid, role);
    conversation.context = context;

    // Generate system prompt
    console.log('Generating system prompt...');
    const systemPrompt = generateSystemPrompt(context);

    // Prepare conversation history for Gemini
    console.log('Preparing chat history...');
    const chatHistory = conversation.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    console.log('Chat history length:', chatHistory.length);

    // Initialize Gemini model (using Gemini 2.0 Flash for fast responses)
    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    // Prepare messages with system prompt at the beginning
    console.log('Building full history...');
    const fullHistory = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I am your AI assistant for CampusOne and will help you with your academic questions based on the context provided.' }]
      },
      ...chatHistory.slice(0, -1)
    ];

    console.log('Full history length:', fullHistory.length);

    // Generate response
    console.log('Starting chat with Gemini...');
    const chat = model.startChat({
      history: fullHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    console.log('Sending message to Gemini:', message.substring(0, 50) + '...');
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    console.log('Received AI response, length:', aiResponse.length);

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update title if it's the first message
    if (conversation.messages.length === 2) {
      const titleWords = message.split(' ').slice(0, 6).join(' ');
      conversation.title = titleWords.length > 50 
        ? titleWords.substring(0, 47) + '...' 
        : titleWords;
    }

    conversation.lastMessageAt = new Date();
    const savedConv = await conversation.save();
    
    console.log('Conversation saved with', savedConv.messages.length, 'messages');

    res.json({
      conversation: {
        _id: savedConv._id,
        title: savedConv.title,
        messages: savedConv.messages,
        updatedAt: savedConv.updatedAt,
        createdAt: savedConv.createdAt
      }
    });

  } catch (error) {
    console.error('Error processing message:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    let userMessage = 'Failed to process message';
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      userMessage = 'Gemini AI model not available. Please check that the Gemini API is enabled in Google Cloud Console and the API key has proper permissions.';
    } else if (error.message?.includes('API key')) {
      userMessage = 'Invalid API key. Please check your Gemini API key configuration.';
    }
    
    res.status(500).json({ 
      message: userMessage,
      error: error.message,
      hint: 'Visit https://makersuite.google.com/app/apikey to verify your API key and ensure the Generative Language API is enabled.'
    });
  }
});

// Delete a conversation
router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const { firebaseUid } = req.user;
    const { conversationId } = req.params;

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: conversationId, userId: firebaseUid },
      { isActive: false },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
