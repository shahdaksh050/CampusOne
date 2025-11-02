const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { authorizeRole } = require('../middleware/auth');
const { syncCourseConversation, addStudentToCourseConversation, removeStudentFromCourseConversation } = require('../utils/courseConversation');

// Get all courses (populate enrolledStudents and compute currentEnrollment)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('enrolledStudents', 'firstName lastName email studentId');
    const normalized = courses.map(c => ({
      ...c.toObject(),
      currentEnrollment: Array.isArray(c.enrolledStudentUids) ? c.enrolledStudentUids.length : ((c.enrolledStudents || []).length || c.currentEnrollment || 0),
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('enrolledStudents');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new course (teacher only)
router.post('/', authorizeRole('teacher'), async (req, res) => {
  const course = new Course(req.body);
  try {
    const savedCourse = await course.save();
    
    // Auto-create conversation group for the course
    try {
      await syncCourseConversation(savedCourse._id);
    } catch (convError) {
      console.error('Failed to create course conversation:', convError);
      // Don't fail the course creation if conversation fails
    }
    
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a course (teacher only)
router.put('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCourse) return res.status(404).json({ message: 'Course not found' });
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a course (teacher only)
router.delete('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in a course (student only)
router.post('/:courseId/enroll', authorizeRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const uid = req.user?.firebaseUid;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Prevent duplicate enrollment
    if (Array.isArray(course.enrolledStudentUids) && course.enrolledStudentUids.includes(uid)) {
      return res.status(409).json({ message: 'Already enrolled' });
    }

    course.enrolledStudentUids = Array.isArray(course.enrolledStudentUids) ? course.enrolledStudentUids : [];
    course.enrolledStudentUids.push(uid);
    course.currentEnrollment = course.enrolledStudentUids.length;
    await course.save();

    // Link on student side: find by firebaseUid
    const student = await Student.findOne({ email: req.user.email });
    if (student) {
      student.enrolledCourseIds = Array.isArray(student.enrolledCourseIds) ? student.enrolledCourseIds : [];
      if (!student.enrolledCourseIds.includes(courseId)) student.enrolledCourseIds.push(courseId);
      // Also link to the ref array for population in GET /students
      student.courses = Array.isArray(student.courses) ? student.courses : [];
      if (!student.courses.find(id => String(id) === String(course._id))) {
        student.courses.push(course._id);
      }
      await student.save();
    }

    // Auto-add student to course conversation group
    try {
      await addStudentToCourseConversation(courseId, uid);
    } catch (convError) {
      console.error('Failed to add student to course conversation:', convError);
      // Don't fail enrollment if conversation fails
    }

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enroll error', error);
    res.status(500).json({ message: error.message });
  }
});

// Unenroll from a course (student only)
router.post('/:courseId/unenroll', authorizeRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const uid = req.user?.firebaseUid;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Remove student from course
    if (Array.isArray(course.enrolledStudentUids)) {
      course.enrolledStudentUids = course.enrolledStudentUids.filter(studentUid => studentUid !== uid);
      course.currentEnrollment = course.enrolledStudentUids.length;
      await course.save();
    }

    // Remove from student side
    const student = await Student.findOne({ email: req.user.email });
    if (student) {
      if (Array.isArray(student.enrolledCourseIds)) {
        student.enrolledCourseIds = student.enrolledCourseIds.filter(id => String(id) !== String(courseId));
      }
      if (Array.isArray(student.courses)) {
        student.courses = student.courses.filter(id => String(id) !== String(courseId));
      }
      await student.save();
    }

    // Remove student from course conversation group
    try {
      await removeStudentFromCourseConversation(courseId, uid);
    } catch (convError) {
      console.error('Failed to remove student from course conversation:', convError);
    }

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll error', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
