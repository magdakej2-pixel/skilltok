const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories — All categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch categories' } });
  }
});

module.exports = router;
