require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Student = require('./models/Student');
const User = require('./models/User');
const { syncCourseConversation } = require('./utils/courseConversation');

async function enrollStudentsInCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all students
    const students = await Student.find();
    console.log(`👥 Found ${students.length} students`);

    // Get all courses
    const courses = await Course.find({ status: 'Active' });
    console.log(`📚 Found ${courses.length} courses\n`);

    if (students.length === 0 || courses.length === 0) {
      console.log('❌ No students or courses found');
      await mongoose.connection.close();
      return;
    }

    // Get user UIDs for students
    const studentEmails = students.map(s => s.email).filter(Boolean);
    const users = await User.find({ email: { $in: studentEmails } });
    const emailToUidMap = new Map(users.map(u => [u.email, u.firebaseUid]));

    // Enroll students randomly into courses (each student in 2-4 courses)
    for (const student of students) {
      const studentUid = emailToUidMap.get(student.email);
      if (!studentUid) {
        console.log(`⚠️  No UID found for student: ${student.email}`);
        continue;
      }

      // Randomly select 2-4 courses for each student
      const numCoursesToEnroll = Math.floor(Math.random() * 3) + 2; // 2-4 courses
      const shuffledCourses = courses.sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numCoursesToEnroll);

      console.log(`\n📝 Enrolling ${student.firstName} ${student.lastName} in ${selectedCourses.length} courses:`);

      for (const course of selectedCourses) {
        // Add student UID to course
        if (!course.enrolledStudentUids) {
          course.enrolledStudentUids = [];
        }
        if (!course.enrolledStudentUids.includes(studentUid)) {
          course.enrolledStudentUids.push(studentUid);
        }

        // Add course to student's ref array
        if (!student.courses) {
          student.courses = [];
        }
        if (!student.courses.find(id => String(id) === String(course._id))) {
          student.courses.push(course._id);
        }

        // Add to enrolledCourseIds
        if (!student.enrolledCourseIds) {
          student.enrolledCourseIds = [];
        }
        if (!student.enrolledCourseIds.includes(String(course._id))) {
          student.enrolledCourseIds.push(String(course._id));
        }

        console.log(`  ✅ ${course.courseCode}: ${course.title}`);
      }

      await student.save();
    }

    // Save all course updates and sync enrollment counts
    console.log('\n💾 Saving course enrollment data...');
    for (const course of courses) {
      course.currentEnrollment = course.enrolledStudentUids?.length || 0;
      await course.save();
      console.log(`  ✅ ${course.courseCode}: ${course.currentEnrollment} students enrolled`);
    }

    // Now sync all course conversations with enrolled students
    console.log('\n💬 Syncing course conversations...');
    for (const course of courses) {
      try {
        const conversation = await syncCourseConversation(course._id);
        console.log(`  ✅ ${course.courseCode}: ${conversation?.participants.length || 0} participants in conversation`);
      } catch (error) {
        console.log(`  ❌ ${course.courseCode}: Failed to sync conversation - ${error.message}`);
      }
    }

    console.log('\n✅ Enrollment complete!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enrollStudentsInCourses();
