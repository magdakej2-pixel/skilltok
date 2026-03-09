const mongoose = require('mongoose');

const savedVideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  },
  { timestamps: true }
);

savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });
savedVideoSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavedVideo', savedVideoSchema);
