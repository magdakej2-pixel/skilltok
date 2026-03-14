const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const User = require('../models/User');

// Escape regex special characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/search?q=&category=&tag= — Search videos by title, tags, or category
router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim().toLowerCase().slice(0, 50) : '';
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

    const query = { status: 'active' };

    if (tag) {
      // Exact tag match
      query.tags = tag;
    } else if (q) {
      const escaped = escapeRegex(q);
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { tags: { $in: [q.toLowerCase()] } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const videos = await Video.find(query)
      .populate('teacherId', 'displayName avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Search failed' } });
  }
});

// GET /api/search/users?q= — Search users by display name
router.get('/users', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

    if (!q) {
      return res.json({ users: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const escaped = escapeRegex(q);
    const filter = {
      displayName: { $regex: escaped, $options: 'i' },
    };

    const users = await User.find(filter)
      .select('displayName avatarUrl role bio followersCount videosCount expertiseCategory isVerified')
      .sort({ followersCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'User search failed' } });
  }
});

module.exports = router;

