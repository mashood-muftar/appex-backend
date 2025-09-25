// src/models/Supplement.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const SupplementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  form: {
    type: String,
    required: [true, 'Please add a form'],
  },
  reason: {
    type: String,
    required: false
  },
  day: {
    type: Number, // 0-6 representing Sunday-Saturday
    required: [true, 'Please specify a day'],
    min: 0,
    max: 6
  },
  pills: {
    type: Number,
    required: false,
    min: [1, 'At least 1 pill is required'],
    default: 1
  },
  time: {
    type: String,
    required: [true, 'Please specify a time'],
    default: '08:00', // Format: "HH:MM" in 24-hour format
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  schedule: {
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(v) {
          if (this.startDate && v) {
            return v >= this.startDate;
          }
          return true;
        },
        message: props => 'End date must be after start date!'
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed'],
    default: 'pending'
  },
  lastStatusUpdate: {
    type: Date,
    default: null
  },

  // 🔹 New explicit date field
  date: {
    type: Date,
    required: false,
    default:null
  },

  cycleDate: {
    type: Date,
    required: true
  },
  cycleId: { type: String, default: uuidv4 },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Supplement', SupplementSchema);
