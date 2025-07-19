import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(20).toString('hex')
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7*24*60*60*1000) // 7 days from now
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
