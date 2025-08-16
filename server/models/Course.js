const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  // New: store enrolled Firebase UIDs for quick student-course linking
  enrolledStudentUids: [{ type: String }],
  schedule: {
    days: [String],
    time: String
  },
  maxCapacity: {
    type: Number,
    default: 30
  },
  currentEnrollment: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Sync currentEnrollment with enrolledStudentUids length if present
  if (Array.isArray(this.enrolledStudentUids)) {
    this.currentEnrollment = this.enrolledStudentUids.length;
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
