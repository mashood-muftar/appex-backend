import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['share', 'invite'],
    default: 'invite'
  },
  status: {
    type: String,
    enum: ['Invited', 'Accepted', 'Declined', 'Pending'],
    default: 'Invited'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate contacts for same user
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });

// Static method to get contacts by user
contactSchema.statics.getUserContacts = function(userId, type = null) {
  const query = { userId, isActive: true };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to update status
contactSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
