require('dotenv').config();
const mongoose = require('mongoose');
const { syncCourseConversation } = require('./utils/courseConversation');
const Course = require('./models/Course');

async function syncAllCourseConversations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all active courses
    const courses = await Course.find({ status: 'Active' });
    console.log(`📚 Found ${courses.length} active courses`);

    const results = {
      success: [],
      failed: []
    };

    // Sync each course
    for (const course of courses) {
      try {
        const conversation = await syncCourseConversation(course._id);
        results.success.push({
          courseId: course._id,
          courseCode: course.courseCode,
          courseTitle: course.title,
          conversationId: conversation?._id,
          participants: conversation?.participants.length || 0
        });
      } catch (error) {
        results.failed.push({
          courseId: course._id,
          courseCode: course.courseCode,
          courseTitle: course.title,
          error: error.message
        });
      }
    }

    console.log('\n📊 Sync Results:');
    console.log(`✅ Successfully synced: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.success.length > 0) {
      console.log('\n✅ Successful syncs:');
      results.success.forEach(r => {
        console.log(`  - ${r.courseCode}: ${r.courseTitle} (${r.participants} members)`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed syncs:');
      results.failed.forEach(r => {
        console.log(`  - ${r.courseCode}: ${r.courseTitle} - ${r.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncAllCourseConversations();
