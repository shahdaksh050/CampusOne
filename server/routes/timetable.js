const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const TimetableEntry = require('../models/TimetableEntry');
const { authorizeRole } = require('../middleware/auth');

// Get timetable entries (optionally filter by date range if needed)
router.get('/', async (req, res) => {
  try {
    const entries = await TimetableEntry.find().populate('courseId', 'title instructor');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a specific course
router.get('/course/:courseId', async (req, res) => {
  try {
    const timetable = await Timetable.find({ course: req.params.courseId });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a specific day
router.get('/day/:day', async (req, res) => {
  try {
    const timetable = await Timetable.find({ dayOfWeek: req.params.day })
      .populate('course', 'title instructor');
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new timetable entry (teacher only)
router.post('/', authorizeRole('teacher'), async (req, res) => {
  try {
    const entry = await TimetableEntry.create(req.body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a timetable entry (teacher only)
router.put('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const updated = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Timetable entry not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a timetable entry (teacher only)
router.delete('/:id', authorizeRole('teacher'), async (req, res) => {
  try {
    const deleted = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Timetable entry not found' });
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
