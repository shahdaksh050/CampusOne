require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');

async function createStudentUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const students = await Student.find();
    console.log(`👥 Found ${students.length} students\n`);

    for (const student of students) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: student.email });
      
      if (existingUser) {
        console.log(`✅ User already exists: ${student.email}`);
        continue;
      }

      // Create a user with a dummy Firebase UID (simulation)
      const firebaseUid = `student_${student.rollNumber.replace(/\//g, '_')}_${Date.now()}`;
      
      const newUser = await User.create({
        firebaseUid: firebaseUid,
        email: student.email,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'student',
        profilePicture: null,
        createdAt: new Date()
      });

      console.log(`✅ Created user: ${newUser.email} (UID: ${firebaseUid})`);
    }

    console.log('\n✅ All student users created!');
    console.log('\n💡 Note: These are dummy Firebase UIDs for demonstration.');
    console.log('   In production, users would register through Firebase Authentication.\n');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createStudentUsers();
