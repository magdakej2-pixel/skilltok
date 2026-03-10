const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['teacher', 'student'], required: true },
    bio: { type: String, maxlength: 150, default: '' },
    lastNameChange: { type: Date, default: null },
    coffeesReceived: { type: Number, default: 0 },
    expertiseCategory: { type: String, default: '' },
    gender: { type: String, default: '', enum: ['', 'male', 'female'] },
    language: { type: String, default: 'en', enum: ['en', 'pl', 'zh'] },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    videosCount: { type: Number, default: 0 },
    // Monetization (prepared, disabled for MVP)
    monetizationTier: { type: String, default: null, enum: [null, 'free', 'premium', 'pro'] },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
