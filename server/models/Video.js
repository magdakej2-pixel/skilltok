const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoUrl: { type: String, required: true },
    coverUrl: { type: String, default: '' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    tags: [{ type: String, trim: true, lowercase: true }],
    category: { type: String, required: true, index: true },
    duration: { type: Number, default: 0 },       // seconds
    fileSize: { type: Number, default: 0 },        // bytes
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'draft', 'scheduled', 'deleted'],
      default: 'active',
      index: true,
    },
    scheduledAt: { type: Date, default: null },     // Phase 2 feature
    language: { type: String, default: 'en' },
    // Monetization (prepared, disabled for MVP)
    isPremium: { type: Boolean, default: false },
    premiumPrice: { type: Number, default: null },
  },
  { timestamps: true }
);

// Index for feed queries
videoSchema.index({ status: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });

module.exports = mongoose.model('Video', videoSchema);
