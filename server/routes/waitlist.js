const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');
const { body, validationResult } = require('express-validator');

// POST /api/waitlist — Add email to beta waitlist
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('language').optional().isIn(['en', 'pl', 'zh']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email;

      // Check if already on waitlist
      const existing = await Waitlist.findOne({ email });
      if (existing) {
        return res.json({ message: 'already_registered', success: true });
      }

      await Waitlist.create({
        email,
        language: req.body.language || 'en',
      });

      const count = await Waitlist.countDocuments();

      res.status(201).json({
        message: 'registered',
        success: true,
        position: count,
      });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to join waitlist' } });
    }
  }
);

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
