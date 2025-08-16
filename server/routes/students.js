const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authorizeRole } = require('../middleware/auth');

// Get all students with optional search/filters and populate enrolled courses
// Query: search, course, year, status
router.get('/', async (req, res) => {
  try {
    const { search, course, year, status } = req.query;
    const query = {};

    if (search) {
      const rx = new RegExp(search, 'i');
      query.$or = [
        { firstName: rx },
        { lastName: rx },
        { studentId: rx },
        { rollNumber: rx },
        { email: rx },
        { program: rx },
      ];
    }
    if (course) {
      query.program = course;
    }
    if (year) {
      const y = Number(year);
      if (!Number.isNaN(y)) query.year = y;
    }
    if (status) {
      query.status = status;
    }

    // Populate the 'courses' ref to return course objects and also attach enrolledCourseIds
    const students = await Student.find(query)
      .populate('courses', 'title _id instructor');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('courses');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new student (teacher only)
router.post('/', authorizeRole('teacher'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, program, year, status } = req.body;
    if (!firstName || !lastName || !email || !program) {
      return res.status(400).json({ message: 'firstName, lastName, email and program are required' });
    }
    // Generate a unique rollNumber (e.g., short UUID)
    const rollNumber = `R${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    // Generate a studentId if not supplied
    const studentId = req.body.studentId || `SID${Date.now().toString().slice(-6)}`;

    const student = await Student.create({
      studentId,
      rollNumber,
      firstName,
      lastName,
      email,
      phone: phone || '',
      program,
      year: Number(year) || 1,
      status: status || 'Active',
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a student (teacher only)
router.put('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });
    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a student (teacher only)
router.delete('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student enrollments (teacher only): set courses and enrolledCourseIds
router.put('/:id/enrollments', authorizeRole('teacher'), async (req, res) => {
  try {
    const { courseIds = [] } = req.body;
    const ids = Array.isArray(courseIds) ? courseIds : [];
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { courses: ids, enrolledCourseIds: ids.map(String) } },
      { new: true }
    ).populate('courses', 'title _id instructor');
    if (!updated) return res.status(404).json({ message: 'Student not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
