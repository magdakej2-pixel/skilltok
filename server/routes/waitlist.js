const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

// POST /api/waitlist — Add email to beta waitlist
router.post('/', async (req, res) => {
  try {
    const { email, language } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: { message: 'Valid email is required' } });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.json({ message: 'already_registered', success: true });
    }

    await Waitlist.create({
      email: email.toLowerCase().trim(),
      language: language || 'en',
    });

    const count = await Waitlist.countDocuments();

    res.status(201).json({
      message: 'registered',
      success: true,
      position: count,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: { message: 'Failed to join waitlist' } });
  }
});

// GET /api/waitlist/count — Get waitlist count (public)
router.get('/count', async (req, res) => {
  try {
    const count = await Waitlist.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get count' } });
  }
});

module.exports = router;
