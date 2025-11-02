const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Course = require('./models/Course');
const Student = require('./models/Student');
const Timetable = require('./models/Timetable');
const TimetableEntry = require('./models/TimetableEntry');
const Attendance = require('./models/Attendance');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing demo data...');
    await Course.deleteMany({});
    await Student.deleteMany({});
    await TimetableEntry.deleteMany({});
    await Attendance.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // Create Teachers
    console.log('👨‍🏫 Creating teachers...');
    const teachers = [
      { firebaseUid: 'teacher1_uid', email: 'dr.smith@campus.edu', role: 'teacher', firstName: 'John', lastName: 'Smith' },
      { firebaseUid: 'teacher2_uid', email: 'prof.johnson@campus.edu', role: 'teacher', firstName: 'Sarah', lastName: 'Johnson' },
      { firebaseUid: 'teacher3_uid', email: 'dr.williams@campus.edu', role: 'teacher', firstName: 'Michael', lastName: 'Williams' },
      { firebaseUid: 'teacher4_uid', email: 'prof.davis@campus.edu', role: 'teacher', firstName: 'Emily', lastName: 'Davis' },
      { firebaseUid: 'teacher5_uid', email: 'dr.brown@campus.edu', role: 'teacher', firstName: 'Robert', lastName: 'Brown' }
    ];

    for (const teacher of teachers) {
      await User.findOneAndUpdate(
        { email: teacher.email },
        teacher,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created ${teachers.length} teachers`);

    // Create Courses
    console.log('📚 Creating courses...');
    const courses = [
      {
        title: 'Introduction to Computer Science',
        courseCode: 'CS101',
        description: 'Fundamental concepts of programming, algorithms, and data structures. Learn Python, problem-solving, and computational thinking.',
        instructor: 'Dr. John Smith',
        duration: '15 weeks',
        credits: 4,
        level: 'Beginner',
        schedule: { days: ['Monday', 'Wednesday', 'Friday'], time: '9:00 AM - 10:30 AM' },
        maxCapacity: 50,
        currentEnrollment: 42,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Data Structures and Algorithms',
        courseCode: 'CS201',
        description: 'Advanced data structures, algorithm design and analysis. Master trees, graphs, sorting, searching, and complexity analysis.',
        instructor: 'Prof. Sarah Johnson',
        duration: '15 weeks',
        credits: 4,
        level: 'Intermediate',
        schedule: { days: ['Tuesday', 'Thursday'], time: '11:00 AM - 12:30 PM' },
        maxCapacity: 45,
        currentEnrollment: 38,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Database Management Systems',
        courseCode: 'CS301',
        description: 'Database design, SQL, normalization, and transaction management. Work with MySQL, MongoDB, and modern database technologies.',
        instructor: 'Dr. Michael Williams',
        duration: '15 weeks',
        credits: 3,
        level: 'Intermediate',
        schedule: { days: ['Monday', 'Wednesday'], time: '2:00 PM - 3:30 PM' },
        maxCapacity: 40,
        currentEnrollment: 35,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Web Development',
        courseCode: 'CS302',
        description: 'Full-stack web development with modern frameworks and tools. Build responsive applications with React, Node.js, and Express.',
        instructor: 'Prof. Emily Davis',
        duration: '15 weeks',
        credits: 3,
        level: 'Intermediate',
        schedule: { days: ['Tuesday', 'Thursday'], time: '2:00 PM - 3:30 PM' },
        maxCapacity: 35,
        currentEnrollment: 32,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Artificial Intelligence',
        courseCode: 'CS401',
        description: 'Machine learning, neural networks, and AI applications. Explore deep learning, NLP, and computer vision with Python and TensorFlow.',
        instructor: 'Dr. Robert Brown',
        duration: '15 weeks',
        credits: 4,
        level: 'Advanced',
        schedule: { days: ['Monday', 'Wednesday', 'Friday'], time: '11:00 AM - 12:00 PM' },
        maxCapacity: 30,
        currentEnrollment: 28,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Discrete Mathematics',
        courseCode: 'MATH201',
        description: 'Logic, set theory, graph theory, and combinatorics. Essential mathematical foundations for computer science.',
        instructor: 'Dr. John Smith',
        duration: '15 weeks',
        credits: 3,
        level: 'Intermediate',
        schedule: { days: ['Tuesday', 'Thursday'], time: '9:00 AM - 10:30 AM' },
        maxCapacity: 50,
        currentEnrollment: 45,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Technical Writing',
        courseCode: 'ENG101',
        description: 'Professional communication and documentation skills. Master technical documentation, reports, and presentations.',
        instructor: 'Prof. Sarah Johnson',
        duration: '15 weeks',
        credits: 2,
        level: 'Beginner',
        schedule: { days: ['Friday'], time: '1:00 PM - 3:00 PM' },
        maxCapacity: 40,
        currentEnrollment: 36,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Software Engineering',
        courseCode: 'CS303',
        description: 'Software development lifecycle, testing, and project management. Learn Agile, DevOps, and modern development practices.',
        instructor: 'Dr. Michael Williams',
        duration: '15 weeks',
        credits: 3,
        level: 'Intermediate',
        schedule: { days: ['Monday', 'Wednesday'], time: '4:00 PM - 5:30 PM' },
        maxCapacity: 35,
        currentEnrollment: 30,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Mobile App Development',
        courseCode: 'CS304',
        description: 'Build native and cross-platform mobile applications. Work with React Native, Flutter, and mobile UI/UX design.',
        instructor: 'Prof. Emily Davis',
        duration: '15 weeks',
        credits: 3,
        level: 'Intermediate',
        schedule: { days: ['Tuesday', 'Thursday'], time: '4:00 PM - 5:30 PM' },
        maxCapacity: 30,
        currentEnrollment: 25,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Computer Networks',
        courseCode: 'CS305',
        description: 'Network protocols, architecture, and security. Study TCP/IP, HTTP, DNS, and modern networking concepts.',
        instructor: 'Dr. Robert Brown',
        duration: '15 weeks',
        credits: 3,
        level: 'Advanced',
        schedule: { days: ['Monday', 'Wednesday'], time: '10:30 AM - 12:00 PM' },
        maxCapacity: 35,
        currentEnrollment: 30,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Operating Systems',
        courseCode: 'CS306',
        description: 'OS design, processes, memory management, and file systems. Deep dive into Linux kernel and system programming.',
        instructor: 'Dr. Michael Williams',
        duration: '15 weeks',
        credits: 4,
        level: 'Advanced',
        schedule: { days: ['Tuesday', 'Thursday'], time: '9:00 AM - 10:30 AM' },
        maxCapacity: 30,
        currentEnrollment: 28,
        semester: 'Fall 2025',
        status: 'Active'
      },
      {
        title: 'Cybersecurity Fundamentals',
        courseCode: 'CS402',
        description: 'Security principles, cryptography, and ethical hacking. Learn to protect systems and identify vulnerabilities.',
        instructor: 'Dr. Robert Brown',
        duration: '15 weeks',
        credits: 3,
        level: 'Advanced',
        schedule: { days: ['Monday', 'Wednesday'], time: '1:00 PM - 2:30 PM' },
        maxCapacity: 25,
        currentEnrollment: 22,
        semester: 'Fall 2025',
        status: 'Active'
      }
    ];

    const createdCourses = await Course.insertMany(courses);
    console.log(`✅ Created ${createdCourses.length} courses`);

    // Create Students
    console.log('👨‍🎓 Creating students...');
    const students = [
      { studentId: 'STU001', rollNumber: 'CS2021001', firstName: 'Alex', lastName: 'Thompson', email: 'alex.thompson@student.edu', program: 'Computer Science', year: 3, gpa: 3.8, phone: '555-0101' },
      { studentId: 'STU002', rollNumber: 'CS2022002', firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@student.edu', program: 'Computer Science', year: 2, gpa: 3.9, phone: '555-0102' },
      { studentId: 'STU003', rollNumber: 'IT2020003', firstName: 'James', lastName: 'Martinez', email: 'james.martinez@student.edu', program: 'Information Technology', year: 4, gpa: 3.6, phone: '555-0103' },
      { studentId: 'STU004', rollNumber: 'CS2023004', firstName: 'Olivia', lastName: 'Anderson', email: 'olivia.anderson@student.edu', program: 'Computer Science', year: 1, gpa: 3.7, phone: '555-0104' },
      { studentId: 'STU005', rollNumber: 'SE2021005', firstName: 'Noah', lastName: 'Garcia', email: 'noah.garcia@student.edu', program: 'Software Engineering', year: 3, gpa: 3.5, phone: '555-0105' },
      { studentId: 'STU006', rollNumber: 'CS2022006', firstName: 'Sophia', lastName: 'Rodriguez', email: 'sophia.rodriguez@student.edu', program: 'Computer Science', year: 2, gpa: 4.0, phone: '555-0106' },
      { studentId: 'STU007', rollNumber: 'DS2020007', firstName: 'Liam', lastName: 'Hernandez', email: 'liam.hernandez@student.edu', program: 'Data Science', year: 4, gpa: 3.8, phone: '555-0107' },
      { studentId: 'STU008', rollNumber: 'CS2023008', firstName: 'Ava', lastName: 'Lopez', email: 'ava.lopez@student.edu', program: 'Computer Science', year: 1, gpa: 3.6, phone: '555-0108' },
      { studentId: 'STU009', rollNumber: 'IT2021009', firstName: 'Ethan', lastName: 'Lee', email: 'ethan.lee@student.edu', program: 'Information Technology', year: 3, gpa: 3.7, phone: '555-0109' },
      { studentId: 'STU010', rollNumber: 'CS2022010', firstName: 'Isabella', lastName: 'Kim', email: 'isabella.kim@student.edu', program: 'Computer Science', year: 2, gpa: 3.9, phone: '555-0110' },
      { studentId: 'STU011', rollNumber: 'SE2020011', firstName: 'Mason', lastName: 'Chen', email: 'mason.chen@student.edu', program: 'Software Engineering', year: 4, gpa: 3.5, phone: '555-0111' },
      { studentId: 'STU012', rollNumber: 'CS2023012', firstName: 'Mia', lastName: 'Patel', email: 'mia.patel@student.edu', program: 'Computer Science', year: 1, gpa: 3.8, phone: '555-0112' },
      { studentId: 'STU013', rollNumber: 'DS2021013', firstName: 'Lucas', lastName: 'Singh', email: 'lucas.singh@student.edu', program: 'Data Science', year: 3, gpa: 3.6, phone: '555-0113' },
      { studentId: 'STU014', rollNumber: 'CS2022014', firstName: 'Charlotte', lastName: 'Wang', email: 'charlotte.wang@student.edu', program: 'Computer Science', year: 2, gpa: 3.9, phone: '555-0114' },
      { studentId: 'STU015', rollNumber: 'IT2020015', firstName: 'Benjamin', lastName: 'Taylor', email: 'benjamin.taylor@student.edu', program: 'Information Technology', year: 4, gpa: 3.7, phone: '555-0115' },
      { studentId: 'STU016', rollNumber: 'CS2023016', firstName: 'Amelia', lastName: 'Brown', email: 'amelia.brown@student.edu', program: 'Computer Science', year: 1, gpa: 3.8, phone: '555-0116' },
      { studentId: 'STU017', rollNumber: 'SE2021017', firstName: 'Logan', lastName: 'Miller', email: 'logan.miller@student.edu', program: 'Software Engineering', year: 3, gpa: 3.5, phone: '555-0117' },
      { studentId: 'STU018', rollNumber: 'CS2022018', firstName: 'Harper', lastName: 'Davis', email: 'harper.davis@student.edu', program: 'Computer Science', year: 2, gpa: 4.0, phone: '555-0118' },
      { studentId: 'STU019', rollNumber: 'DS2020019', firstName: 'Jackson', lastName: 'Wilson', email: 'jackson.wilson@student.edu', program: 'Data Science', year: 4, gpa: 3.6, phone: '555-0119' },
      { studentId: 'STU020', rollNumber: 'CS2023020', firstName: 'Evelyn', lastName: 'Martinez', email: 'evelyn.martinez@student.edu', program: 'Computer Science', year: 1, gpa: 3.7, phone: '555-0120' }
    ];

    const createdStudents = await Student.insertMany(students);
    console.log(`✅ Created ${createdStudents.length} students`);

    // Create Timetable Entries (skip for now due to schema issues)
    console.log('📅 Skipping timetable entries (can be added manually via UI)...');
    const createdEntries = [];
    // You can add timetable entries manually through the UI
    console.log(`✅ Created ${createdEntries.length} timetable entries`);

    // Create sample attendance records (skip for now - can be added via UI)
    console.log('✅ Skipping attendance records (can be added via UI)...');
    const attendanceRecords = [];
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // Create sample conversations and messages (skip for now)
    console.log('💬 Skipping conversations (can be created via Messages UI)...');
    const createdConversations = [];
    const messages = [];
    console.log(`✅ Created ${createdConversations.length} conversations`);
    console.log(`✅ Created ${messages.length} messages`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${teachers.length} Teachers`);
    console.log(`   - ${createdCourses.length} Courses`);
    console.log(`   - ${createdStudents.length} Students`);
    console.log(`   - ${createdEntries.length} Timetable Entries`);
    console.log(`   - ${attendanceRecords.length} Attendance Records`);
    console.log(`   - ${createdConversations.length} Conversations`);
    console.log(`   - ${messages.length} Messages`);
    console.log('\n✅ Your demo is ready for the professor!\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
