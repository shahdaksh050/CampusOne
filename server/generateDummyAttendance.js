require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Student = require('./models/Student');
const Course = require('./models/Course');
const User = require('./models/User');

async function generateDummyAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing attendance records
    await Attendance.deleteMany({});
    console.log('🗑️  Cleared existing attendance records');

    // Get all students and courses
    const students = await Student.find().populate('courses');
    const courses = await Course.find({ status: 'Active' }).populate('instructor', 'firebaseUid');
    const users = await User.find({ role: 'teacher' });

    console.log(`\n📊 Found:`);
    console.log(`   Students: ${students.length}`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Teachers: ${users.length}\n`);

    const defaultTeacherUid = users.length > 0 ? users[0].firebaseUid : 'system';
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Excused'];
    
    let totalRecords = 0;
    let attemptedRecords = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Start from 30 days ago

    // Generate attendance for each student in their enrolled courses
    for (const student of students) {
      if (!student.courses || student.courses.length === 0) continue;
      
      console.log(`\n Processing ${student.firstName} ${student.lastName}...`);

      for (const courseRef of student.courses) {
        // Ensure we get the ObjectId properly
        const rawId = typeof courseRef === 'object' ? courseRef._id : courseRef;
        const courseId = rawId instanceof mongoose.Types.ObjectId ? rawId : new mongoose.Types.ObjectId(rawId);
        const course = courses.find(c => String(c._id) === String(courseId));
        
        if (!course) {
          console.log(`  ⚠️  Course not found for ID: ${courseId}`);
          continue;
        }

        // Use course instructor or fallback to default teacher
        const recordedBy = course.instructor?.firebaseUid || course.instructor || defaultTeacherUid;
        console.log(`  📝 Creating attendance for ${course.courseCode}, recordedBy: ${recordedBy}, courseId type: ${typeof courseId}, value: ${courseId}`);

        // Generate attendance for last 30 days (roughly 3 classes per week = ~12 records)
        const daysToGenerate = [2, 5, 9, 12, 16, 19, 23, 26, 30]; // Sample class days
        
        for (const dayOffset of daysToGenerate) {
          const classDate = new Date(startDate);
          classDate.setDate(classDate.getDate() + dayOffset);
          attemptedRecords++;
          
          // Random status with higher probability of Present
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          try {
            const attendanceData = {
              student: student._id,
              course: courseId,
              date: classDate,
              status: status,
              notes: status === 'Late' ? 'Arrived 10 minutes late' : 
                     status === 'Excused' ? 'Medical appointment' : '',
              recordedBy: recordedBy
            };
            
            if (attemptedRecords <= 20) {
              console.log(`     Attempt ${attemptedRecords}: student=${String(student._id).slice(-4)}, course=${String(courseId).slice(-4)}, date=${classDate.toISOString().split('T')[0]}`);
            }
            
            const newRecord = await Attendance.create(attendanceData);
            totalRecords++;
            if (totalRecords <= 15) {
              console.log(`     ✓ Created: ${student.firstName} - ${course.courseCode} - ${classDate.toISOString().split('T')[0]}`);
            }
          } catch (error) {
            // Skip duplicates
            if (error.code === 11000) {
              if (attemptedRecords <= 30) {
                console.log(`     ⚠️  Duplicate: ${student.firstName} - ${course.courseCode} - ${classDate.toISOString().split('T')[0]}`);
              }
            } else {
              console.error(`   ❌ Error: ${error.message} for ${student.firstName} on ${classDate.toISOString().split('T')[0]}`);
            }
          }
        }

        console.log(`✅ Generated attendance for ${student.firstName} ${student.lastName} in ${course.courseCode}`);
      }
    }

    console.log(`\n🎉 Successfully generated ${totalRecords} attendance records out of ${attemptedRecords} attempts!`);

    // Show summary statistics
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Attendance Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} records`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateDummyAttendance();
