const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instructorUid: { type: String, required: true }, // firebaseUid
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String, required: true },   // HH:MM
  room: { type: String, required: true },
  studentsCount: { type: Number, default: 0 },
  semester: { type: String, required: true },
  conflict: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
