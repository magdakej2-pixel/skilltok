const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Like = require('../models/Like');
const SavedVideo = require('../models/SavedVideo');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const VideoView = require('../models/VideoView');
const User = require('../models/User');
const { authenticate, requireUser, requireTeacher, optionalAuth } = require('../middleware/auth');
const { validateObjectId, stripHtml } = require('../middleware/validate');
const { body, validationResult } = require('express-validator');

// GET /api/videos/feed — Paginated video feed
router.get('/feed', async (req, res) => {
  try {
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
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
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

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
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

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
router.get('/teacher/:id', validateObjectId(), async (req, res) => {
  try {
    const videos = await Video.find({ teacherId: req.params.id, status: 'active' })
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch teacher videos' } });
  }
});

// GET /api/videos/:id — Single video
router.get('/:id', optionalAuth, validateObjectId(), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('teacherId', 'displayName avatarUrl role expertiseCategory isVerified');
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    // Deduplicated view count: one view per IP/user per 24h (TTL index)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    // Use user MongoDB _id (not token prefix) to avoid leaking credentials
    const viewerKey = req.user
      ? `user:${req.user._id}`
      : `ip:${ip}`;

    try {
      await VideoView.create({ videoId: req.params.id, viewerKey });
      // Only increment if the view is new (create succeeded)
      await Video.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    } catch (dupErr) {
      // Duplicate key error (11000) = already viewed, skip increment
      if (dupErr.code !== 11000) console.error('View tracking error:', dupErr.message);
    }

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
    body('videoUrl').notEmpty().isURL({ protocols: ['https'], require_protocol: true }),
    body('coverUrl').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
    body('title').trim().notEmpty().isLength({ max: 200 }).customSanitizer(stripHtml),
    body('description').optional().isLength({ max: 1000 }).customSanitizer(stripHtml),
    body('category').notEmpty(),
    body('tags').optional().isArray({ max: 10 }),
    body('tags.*').optional().isString().isLength({ max: 30 }).customSanitizer(v => stripHtml(v).toLowerCase()),
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
router.put(
  '/:id',
  authenticate,
  requireTeacher,
  validateObjectId(),
  [
    body('title').optional().trim().isLength({ max: 200 }).customSanitizer(stripHtml),
    body('description').optional().isLength({ max: 1000 }).customSanitizer(stripHtml),
    body('coverUrl').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
    body('status').optional().isIn(['active', 'draft', 'deleted']),
    body('tags').optional().isArray({ max: 10 }),
    body('tags.*').optional().isString().isLength({ max: 30 }).customSanitizer(v => stripHtml(v).toLowerCase()),
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

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
router.delete('/:id', authenticate, requireTeacher, validateObjectId(), async (req, res) => {
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
router.post('/:id/like', authenticate, requireUser, validateObjectId(), async (req, res) => {
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
router.post('/:id/save', authenticate, requireUser, validateObjectId(), async (req, res) => {
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
router.get('/:id/comments', validateObjectId(), async (req, res) => {
  try {
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

    const comments = await Comment.find({ videoId: req.params.id, parentCommentId: null })
      .populate('userId', 'displayName avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Batch-fetch all replies in one query instead of N+1
    const commentIds = comments.map(c => c._id);
    const allReplies = await Comment.find({ parentCommentId: { $in: commentIds } })
      .populate('userId', 'displayName avatarUrl role')
      .sort({ createdAt: 1 });

    // Group replies by parent comment, limit to 5 per parent
    const repliesByParent = {};
    for (const reply of allReplies) {
      const parentId = reply.parentCommentId.toString();
      if (!repliesByParent[parentId]) repliesByParent[parentId] = [];
      if (repliesByParent[parentId].length < 5) {
        repliesByParent[parentId].push(reply);
      }
    }

    const commentsWithReplies = comments.map(comment => ({
      ...comment.toObject(),
      replies: repliesByParent[comment._id.toString()] || [],
    }));

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
  [body('text').trim().notEmpty().isLength({ max: 500 }).customSanitizer(stripHtml)],
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
router.post('/:id/comments/:commentId/like', authenticate, requireUser, validateObjectId(), validateObjectId('commentId'), async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: { message: 'Comment not found' } });

    // Use CommentLike collection instead of unbounded likedBy array
    const existing = await CommentLike.findOne({
      commentId: req.params.commentId,
      userId: req.user._id,
    });

    if (existing) {
      await existing.deleteOne();
      await Comment.findByIdAndUpdate(req.params.commentId, {
        $inc: { likesCount: -1 },
      });
      res.json({ liked: false, likesCount: Math.max(0, (comment.likesCount || 0) - 1) });
    } else {
      await CommentLike.create({
        commentId: req.params.commentId,
        userId: req.user._id,
      });
      await Comment.findByIdAndUpdate(req.params.commentId, {
        $inc: { likesCount: 1 },
      });
      res.json({ liked: true, likesCount: (comment.likesCount || 0) + 1 });
    }
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ error: { message: 'Like action failed' } });
  }
});

module.exports = router;
