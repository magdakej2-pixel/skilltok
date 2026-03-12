const mongoose = require('mongoose');

const videoViewSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    viewerKey: { type: String, required: true }, // either "user:<userId>" or "ip:<ipAddress>"
  },
  { timestamps: true }
);

// Compound unique index: one view per viewer per video
videoViewSchema.index({ videoId: 1, viewerKey: 1 }, { unique: true });

// TTL: auto-delete views after 24h so the same user can count again next day
videoViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('VideoView', videoViewSchema);
