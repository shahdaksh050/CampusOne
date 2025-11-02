const Conversation = require('../models/Conversation');
const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Create or update a course conversation group
 * Automatically adds all enrolled students and the course instructor
 */
async function syncCourseConversation(courseId) {
  try {
    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new Error('Course not found');
    }

    // Get instructor's firebaseUid
    const instructor = await User.findOne({ 
      $or: [
        { email: course.instructor },
        { name: course.instructor },
        { firstName: course.instructor },
        { lastName: course.instructor }
      ],
      role: 'teacher'
    }, 'firebaseUid').lean();

    const participants = [];
    
    // Add instructor
    if (instructor?.firebaseUid) {
      participants.push(instructor.firebaseUid);
    }

    // Add all enrolled students by their UIDs
    if (course.enrolledStudentUids && course.enrolledStudentUids.length > 0) {
      participants.push(...course.enrolledStudentUids);
    }

    // Remove duplicates
    const uniqueParticipants = Array.from(new Set(participants));

    if (uniqueParticipants.length === 0) {
      console.log(`No participants found for course ${course.title}`);
      return null;
    }

    // Check if conversation already exists for this course
    let conversation = await Conversation.findOne({ courseId: courseId });

    if (conversation) {
      // Update existing conversation
      conversation.participants = uniqueParticipants;
      conversation.name = `${course.courseCode || course.title} - Class Group`;
      conversation.description = course.description;
      conversation.courseTag = course.courseCode;
      conversation.groupInfo = `${uniqueParticipants.length} member${uniqueParticipants.length === 1 ? '' : 's'}`;
      await conversation.save();
      console.log(`✅ Updated conversation for course: ${course.title} (${uniqueParticipants.length} members)`);
    } else {
      // Create new conversation
      conversation = await Conversation.create({
        participants: uniqueParticipants,
        type: 'course',
        name: `${course.courseCode || course.title} - Class Group`,
        description: course.description,
        courseTag: course.courseCode,
        courseId: courseId,
        groupInfo: `${uniqueParticipants.length} member${uniqueParticipants.length === 1 ? '' : 's'}`,
        avatarColor: '#3b82f6',
        avatarColor2: '#8b5cf6',
      });
      console.log(`✅ Created conversation for course: ${course.title} (${uniqueParticipants.length} members)`);
    }

    return conversation;
  } catch (error) {
    console.error('Error syncing course conversation:', error);
    throw error;
  }
}

/**
 * Add a student to a course conversation
 */
async function addStudentToCourseConversation(courseId, studentUid) {
  try {
    const conversation = await Conversation.findOne({ courseId: courseId });
    
    if (!conversation) {
      // If conversation doesn't exist, sync it
      return await syncCourseConversation(courseId);
    }

    // Add student if not already in conversation
    if (!conversation.participants.includes(studentUid)) {
      conversation.participants.push(studentUid);
      conversation.groupInfo = `${conversation.participants.length} member${conversation.participants.length === 1 ? '' : 's'}`;
      await conversation.save();
      console.log(`✅ Added student to course conversation: ${studentUid}`);
    }

    return conversation;
  } catch (error) {
    console.error('Error adding student to course conversation:', error);
    throw error;
  }
}

/**
 * Remove a student from a course conversation
 */
async function removeStudentFromCourseConversation(courseId, studentUid) {
  try {
    const conversation = await Conversation.findOne({ courseId: courseId });
    
    if (!conversation) {
      return null;
    }

    // Remove student from conversation
    conversation.participants = conversation.participants.filter(uid => uid !== studentUid);
    conversation.groupInfo = `${conversation.participants.length} member${conversation.participants.length === 1 ? '' : 's'}`;
    await conversation.save();
    console.log(`✅ Removed student from course conversation: ${studentUid}`);

    return conversation;
  } catch (error) {
    console.error('Error removing student from course conversation:', error);
    throw error;
  }
}

module.exports = {
  syncCourseConversation,
  addStudentToCourseConversation,
  removeStudentFromCourseConversation,
};
