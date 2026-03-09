const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// GET /api/search?q=&category= — Search videos by title, tags, or category
router.get('/', async (req, res) => {
  try {
    const { q, category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = { status: 'active' };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
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
