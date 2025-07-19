// src/models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  supplement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplement',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  time: {
    type: String, // Changed from Date to String for consistency with Supplement schema
    required: true
  },
  timeType: {
    type: String,
    enum: ['Regular', 'Administrative'],
    default: 'Regular'
  },
  active: {
    type: Boolean,
    default: true
  },
  completed: [{
    date: Date,
    taken: Boolean,
    notes: String
  }]
}, { timestamps: true });

// Index for efficient querying by user and date
scheduleSchema.index({ user: 1, supplement: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;