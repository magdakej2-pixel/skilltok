const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Escape regex special characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/search?q=&category= — Search videos by title, tags, or category
router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));

    const query = { status: 'active' };

    if (q) {
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

module.exports = router;
