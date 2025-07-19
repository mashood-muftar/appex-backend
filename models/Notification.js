import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for faster queries
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['SUPPLEMENT_REMINDER', 'SUPPLEMENT_MISSED', 'SYSTEM', 'TEST_NOTIFICATION'],
    default: 'SYSTEM'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplement',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d' // Auto-delete notifications after 90 days
  }
});

export default mongoose.model('Notification', NotificationSchema);