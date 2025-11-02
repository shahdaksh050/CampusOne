const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authorizeRole } = require('../middleware/auth');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'title');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('course', 'title');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a specific course
router.get('/course/:courseId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ course: req.params.courseId })
      .populate('student', 'firstName lastName studentId');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create attendance record (teacher only)
router.post('/', authorizeRole('teacher'), async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    const savedAttendance = await attendance.save();
    res.status(201).json(savedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update attendance record (teacher only)
router.put('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const updatedAttendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAttendance) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete attendance record (teacher only)
router.delete('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const deletedAttendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!deletedAttendance) return res.status(404).json({ message: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
