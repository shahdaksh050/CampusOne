const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Course = require('./models/Course');
const TimetableEntry = require('./models/TimetableEntry');

async function populateTimetable() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing timetable entries
    await TimetableEntry.deleteMany({});
    console.log('🗑️  Cleared existing timetable entries');

    // Get all courses
    const courses = await Course.find({});
    if (courses.length === 0) {
      console.log('❌ No courses found. Please run seedData.js first.');
      process.exit(1);
    }

    console.log(`📚 Found ${courses.length} courses`);

    // Create timetable entries based on course schedules
    const timetableEntries = [];

    for (const course of courses) {
      if (course.schedule && course.schedule.days && course.schedule.days.length > 0) {
        // Parse time from schedule (e.g., "9:00 AM - 10:30 AM")
        const timeMatch = course.schedule.time.match(/(\d+:\d+\s*[AP]M)\s*-\s*(\d+:\d+\s*[AP]M)/);
        if (timeMatch) {
          const startTime = timeMatch[1].trim();
          const endTime = timeMatch[2].trim();

          // Create entry for each scheduled day
          for (const day of course.schedule.days) {
            timetableEntries.push({
              courseId: course._id,
              instructorUid: 'teacher1_uid', // Default instructor UID
              dayOfWeek: day,
              startTime: startTime,
              endTime: endTime,
              room: `Room ${Math.floor(Math.random() * 300) + 100}`,
              studentsCount: course.currentEnrollment || 0,
              semester: course.semester || 'Fall 2025',
              conflict: false
            });
          }
        }
      }
    }

    if (timetableEntries.length > 0) {
      const created = await TimetableEntry.insertMany(timetableEntries);
      console.log(`✅ Created ${created.length} timetable entries`);
      
      console.log('\n📅 Timetable Summary:');
      created.forEach(entry => {
        console.log(`   - ${entry.dayOfWeek} ${entry.startTime}-${entry.endTime} in ${entry.room}`);
      });
    } else {
      console.log('⚠️  No timetable entries created');
    }

    await mongoose.connection.close();
    console.log('\n✅ Timetable population complete!');
  } catch (error) {
    console.error('❌ Error populating timetable:', error);
    process.exit(1);
  }
}

populateTimetable();
