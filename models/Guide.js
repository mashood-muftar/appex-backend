// src/models/Guide.js
import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  whyItMatters: {
    type: String,
    required: true
  },
  howToPrevent: {
    type: String,
    required: true
  }
});

const guideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Muscle Growth', 'Stress Reduction', 'Recovery', 'Weight Loss', 'Mental Health', 'Sleep', 'General Wellness']
  },
  imageUrl: {
    type: String
  },
  steps: [stepSchema],
  featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Guide = mongoose.model('Guide', guideSchema);

export default Guide;