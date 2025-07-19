// src/models/Progress.js
import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplement',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  taken: {
    type: Boolean,
    default: true
  },
  takenAt: {
    type: Date
  },
  missedReason: {
    type: String
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Compound index for efficient queries
progressSchema.index({ user: 1, supplement: 1, date: 1 });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;