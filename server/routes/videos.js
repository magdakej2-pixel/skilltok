const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Like = require('../models/Like');
const SavedVideo = require('../models/SavedVideo');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { authenticate, requireUser, requireTeacher } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/videos/feed — Paginated video feed
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    const query = { status: 'active' };
    if (category) query.category = category;

    const videos = await Video.find(query)
      .populate('teacherId', 'displayName avatarUrl role expertiseCategory isVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch feed' } });
  }
});

// GET /api/videos/saved — User's saved videos
router.get('/saved', authenticate, requireUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const saved = await SavedVideo.find({ userId: req.user._id })
      .populate({
        path: 'videoId',
        populate: { path: 'teacherId', select: 'displayName avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ videos: saved.map((s) => s.videoId).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch saved videos' } });
  }
});

// GET /api/videos/liked — User's liked videos
router.get('/liked', authenticate, requireUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const liked = await Like.find({ userId: req.user._id })
      .populate({
        path: 'videoId',
        populate: { path: 'teacherId', select: 'displayName avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ videos: liked.map((l) => l.videoId).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch liked videos' } });
  }
});

// GET /api/videos/teacher/:id — Teacher's uploaded videos
router.get('/teacher/:id', async (req, res) => {
  try {
    const videos = await Video.find({ teacherId: req.params.id, status: 'active' })
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch teacher videos' } });
  }
});

// GET /api/videos/:id — Single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('teacherId', 'displayName avatarUrl role expertiseCategory isVerified');
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    // Increment view count
    await Video.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch video' } });
  }
});

// POST /api/videos — Create video (teacher only)
router.post(
  '/',
  authenticate,
  requireTeacher,
  [
    body('videoUrl').notEmpty(),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('category').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const video = await Video.create({
        teacherId: req.user._id,
        videoUrl: req.body.videoUrl,
        coverUrl: req.body.coverUrl || '',
        title: req.body.title,
        description: req.body.description || '',
        tags: req.body.tags || [],
        category: req.body.category,
        duration: req.body.duration || 0,
        fileSize: req.body.fileSize || 0,
        language: req.body.language || req.user.language,
      });

      await User.findByIdAndUpdate(req.user._id, { $inc: { videosCount: 1 } });
      res.status(201).json({ video });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to create video' } });
    }
  }
);

// PUT /api/videos/:id — Update video (owner only)
router.put('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });
    if (video.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    const allowedFields = ['title', 'description', 'tags', 'category', 'coverUrl', 'status'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Video.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ video: updated });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to update video' } });
  }
});

// DELETE /api/videos/:id — Soft delete video (owner only)
router.delete('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });
    if (video.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    await Video.findByIdAndUpdate(req.params.id, { status: 'deleted' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { videosCount: -1 } });
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to delete video' } });
  }
});

// POST /api/videos/:id/like — Toggle like
router.post('/:id/like', authenticate, requireUser, async (req, res) => {
  try {
    const existing = await Like.findOne({ userId: req.user._id, videoId: req.params.id });

    if (existing) {
      await existing.deleteOne();
      await Video.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });
      res.json({ liked: false });
    } else {
      await Like.create({ userId: req.user._id, videoId: req.params.id });
      await Video.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } });
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: { message: 'Like action failed' } });
  }
});

// POST /api/videos/:id/save — Toggle save
router.post('/:id/save', authenticate, requireUser, async (req, res) => {
  try {
    const existing = await SavedVideo.findOne({ userId: req.user._id, videoId: req.params.id });

    if (existing) {
      await existing.deleteOne();
      await Video.findByIdAndUpdate(req.params.id, { $inc: { savesCount: -1 } });
      res.json({ saved: false });
    } else {
      await SavedVideo.create({ userId: req.user._id, videoId: req.params.id });
      await Video.findByIdAndUpdate(req.params.id, { $inc: { savesCount: 1 } });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: { message: 'Save action failed' } });
  }
});

// GET /api/videos/:id/comments — Get comments for a video
router.get('/:id/comments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const comments = await Comment.find({ videoId: req.params.id, parentCommentId: null })
      .populate('userId', 'displayName avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentId: comment._id })
          .populate('userId', 'displayName avatarUrl role')
          .sort({ createdAt: 1 })
          .limit(5);
        return { ...comment.toObject(), replies };
      })
    );

    res.json({ comments: commentsWithReplies });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch comments' } });
  }
});

// POST /api/videos/:id/comments — Add a comment
router.post(
  '/:id/comments',
  authenticate,
  requireUser,
  [body('text').trim().notEmpty().isLength({ max: 500 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const comment = await Comment.create({
        videoId: req.params.id,
        userId: req.user._id,
        text: req.body.text,
        parentCommentId: req.body.parentCommentId || null,
      });

      await Video.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });

      const populated = await comment.populate('userId', 'displayName avatarUrl role');
      res.status(201).json({ comment: populated });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to add comment' } });
    }
  }
);

// POST /api/videos/:id/comments/:commentId/like — Toggle like on a comment
router.post('/:id/comments/:commentId/like', authenticate, requireUser, async (req, res) => {
  try {
    console.log('Comment like request:', req.params.commentId, 'by user:', req.user?._id);
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: { message: 'Comment not found' } });

    // Simple toggle: track liked users in a field, or just increment/decrement
    // For MVP, we'll use a simple liked array approach
    if (!comment.likedBy) comment.likedBy = [];
    const userId = req.user._id.toString();
    const alreadyLiked = comment.likedBy.includes(userId);

    if (alreadyLiked) {
      comment.likedBy = comment.likedBy.filter(id => id !== userId);
      comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likesCount = (comment.likesCount || 0) + 1;
    }
    await comment.save();

    res.json({ liked: !alreadyLiked, likesCount: comment.likesCount });
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ error: { message: 'Like action failed' } });
  }
});

module.exports = router;
