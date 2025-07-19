// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: ''
  },
  deviceToken: {
    type: String,
    default: null
  },
  notificationSettings: {
    pushEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null  
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Method to check password validity
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Set OTP and expiration time (10 minutes)
  this.verificationOTP = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  // Check if OTP exists, matches, and not expired
  return (
    this.verificationOTP &&
    this.verificationOTP.code === otp &&
    this.verificationOTP.expiresAt > new Date()
  );
};

const User = mongoose.model('User', userSchema);

export default User;