const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all attendance records with filters
router.get('/', async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate, status } = req.query;
    
    const filter = {};
    if (courseId) filter.course = courseId;
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(filter)
      .populate('student', 'firstName lastName email rollNumber studentId')
      .populate('course', 'title courseCode instructor')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('course', 'title courseCode')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance statistics for a student
router.get('/student/:studentId/stats', async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = { student: req.params.studentId };
    if (courseId) filter.course = courseId;

    const records = await Attendance.find(filter);
    
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      excused: records.filter(r => r.status === 'Excused').length,
      attendanceRate: 0
    };

    if (stats.total > 0) {
      stats.attendanceRate = ((stats.present + stats.late) / stats.total * 100).toFixed(2);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance for a specific course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { course: req.params.courseId };
    
    if (date) {
      const targetDate = new Date(date);
      filter.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('student', 'firstName lastName email rollNumber studentId')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance statistics for a course
router.get('/course/:courseId/stats', async (req, res) => {
  try {
    const records = await Attendance.find({ course: req.params.courseId });
    
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      excused: records.filter(r => r.status === 'Excused').length,
      attendanceRate: 0
    };

    if (stats.total > 0) {
      stats.attendanceRate = ((stats.present + stats.late) / stats.total * 100).toFixed(2);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create attendance record (teacher only)
router.post('/', authorizeRole('teacher'), async (req, res) => {
  try {
    const { recordedBy } = req.body;
    const attendance = new Attendance({
      ...req.body,
      recordedBy: recordedBy || req.user.firebaseUid
    });
    const savedAttendance = await attendance.save();
    const populated = await Attendance.findById(savedAttendance._id)
      .populate('student', 'firstName lastName email rollNumber')
      .populate('course', 'title courseCode');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already recorded for this student on this date' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Bulk mark attendance (teacher only)
router.post('/bulk', authorizeRole('teacher'), async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    
    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'courseId, date, and records array are required' });
    }

    const results = {
      success: [],
      failed: [],
      updated: []
    };

    for (const record of records) {
      try {
        const { studentId, status, notes } = record;
        
        // Check if attendance already exists
        const existing = await Attendance.findOne({
          student: studentId,
          course: courseId,
          date: new Date(date)
        });

        if (existing) {
          // Update existing record
          existing.status = status;
          existing.notes = notes || existing.notes;
          existing.recordedBy = req.user.firebaseUid;
          await existing.save();
          results.updated.push({ studentId, status: 'updated' });
        } else {
          // Create new record
          const attendance = await Attendance.create({
            student: studentId,
            course: courseId,
            date: new Date(date),
            status: status || 'Present',
            notes: notes || '',
            recordedBy: req.user.firebaseUid
          });
          results.success.push({ studentId, attendanceId: attendance._id });
        }
      } catch (err) {
        results.failed.push({ studentId: record.studentId, error: err.message });
      }
    }

    res.status(201).json({
      message: 'Bulk attendance processed',
      results
    });
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
