// src/models/DiaryShare.js
import mongoose from 'mongoose';

const diaryShareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  sharedDate: {
    type: Date,
    default: Date.now
  },
  timePeriod: {
    type: String,
    enum: ['week', 'month', 'custom'],
    default: 'month'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  supplementsIncluded: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplement'
  }],
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  csvLocation: {
    type: String
  }
}, { timestamps: true });

const DiaryShare = mongoose.model('DiaryShare', diaryShareSchema);

export default DiaryShare;