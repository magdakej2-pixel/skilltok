const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Follow = require('../models/Follow');
const { authenticate, requireUser } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

// GET /api/users/:id — Get user profile
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-firebaseUid');
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch user' } });
  }
});

// POST /api/users/:id/follow — Toggle follow
router.post('/:id/follow', authenticate, requireUser, validateObjectId(), async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'Cannot follow yourself' } });
    }

    const existing = await Follow.findOne({
      followerId: req.user._id,
      followingId: targetId,
    });

    if (existing) {
      // Unfollow
      await existing.deleteOne();
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      res.json({ followed: false });
    } else {
      // Follow
      await Follow.create({ followerId: req.user._id, followingId: targetId });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
      res.json({ followed: true });
    }
  } catch (error) {
    res.status(500).json({ error: { message: 'Follow action failed' } });
  }
});

// GET /api/users/:id/followers — Get followers list
router.get('/:id/followers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const follows = await Follow.find({ followingId: req.params.id })
      .populate('followerId', 'displayName avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ followers: follows.map((f) => f.followerId) });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch followers' } });
  }
});

// GET /api/users/:id/following — Get following list
router.get('/:id/following', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const follows = await Follow.find({ followerId: req.params.id })
      .populate('followingId', 'displayName avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ following: follows.map((f) => f.followingId) });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch following' } });
  }
});

module.exports = router;
