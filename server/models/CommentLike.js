const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Compound unique index: one like per user per comment
commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CommentLike', commentLikeSchema);
