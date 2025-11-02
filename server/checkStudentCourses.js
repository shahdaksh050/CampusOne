require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Course = require('./models/Course');

async function checkStudentCourses() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const alex = await Student.findOne({ firstName: 'Alex' }).populate('courses');
  console.log('Alex Thompson:');
  console.log('  Number of courses:', alex.courses.length);
  console.log('  Courses array:', alex.courses.map(c => `${c.courseCode} (${c._id})`));
  console.log('\n  Raw courses field:');
  alex.courses.forEach((c, i) => {
    console.log(`    ${i + 1}. Type: ${typeof c}, hasId: ${!!c._id}, value: ${c._id || c}`);
  });

  await mongoose.connection.close();
}

checkStudentCourses();
