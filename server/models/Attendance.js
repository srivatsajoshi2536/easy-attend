const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to ensure date is a Date object
attendanceSchema.pre('save', function(next) {
  if (this.date && typeof this.date === 'string') {
    this.date = new Date(this.date);
  }
  next();
});

// Compound index to ensure unique attendance records per student per date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Add a virtual for className
attendanceSchema.virtual('className').get(function() {
  return this.class ? this.class.name : 'Unknown Class';
});

module.exports = mongoose.model('Attendance', attendanceSchema); 