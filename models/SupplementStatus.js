import mongoose from 'mongoose';

const SupplementStatusSchema = new mongoose.Schema({
  supplementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplement',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Additional fields for quicker access
  name: {
    type: String,
    required: false
  },
  day: {
    type: Number,
    required: false
  }
}, { timestamps: true });

// Create index for faster queries
SupplementStatusSchema.index({ supplementId: 1, userId: 1, date: 1 });
SupplementStatusSchema.index({ userId: 1, date: 1, status: 1 });
SupplementStatusSchema.index({ day: 1 });

export default mongoose.model('SupplementStatus', SupplementStatusSchema);