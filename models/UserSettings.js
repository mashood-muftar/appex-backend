// src/models/UserSettings.js
import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  enabledForMissedSupplements: {
    type: Boolean,
    default: true
  },
  customReminderSounds: {
    type: Boolean,
    default: false
  },
  reminderFrequency: {
    type: String,
    enum: ['once', 'twice', 'thrice', 'custom'],
    default: 'once'
  }
});

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notificationSettings: {
    type: notificationSettingsSchema,
    default: () => ({})
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  measurementUnit: {
    type: String,
    enum: ['metric', 'imperial'],
    default: 'metric'
  }
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;