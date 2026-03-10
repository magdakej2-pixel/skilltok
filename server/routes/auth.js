const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// POST /api/auth/register — Create user in MongoDB after Firebase registration
router.post(
  '/register',
  (req, res, next) => { console.log('📥 REGISTER request received, auth header:', req.headers.authorization ? 'present' : 'MISSING'); next(); },
  authenticate,
  [
    body('displayName').trim().notEmpty().withMessage('Display name is required'),
    body('role').isIn(['teacher', 'student']).withMessage('Role must be teacher or student'),
    body('language').optional().isIn(['en', 'pl', 'zh']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user already registered
      const existing = await User.findOne({ firebaseUid: req.firebaseUser.uid });
      if (existing) {
        return res.status(409).json({ error: { message: 'User already registered' } });
      }

      const user = await User.create({
        firebaseUid: req.firebaseUser.uid,
        email: req.firebaseUser.email,
        displayName: req.body.displayName,
        role: req.body.role,
        language: req.body.language || 'en',
        expertiseCategory: req.body.expertiseCategory || '',
        bio: req.body.bio || '',
      });

      res.status(201).json({ user });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: { message: 'Registration failed' } });
    }
  }
);

// POST /api/auth/login — Validate token, return user profile
router.post('/login', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not registered', code: 'NOT_REGISTERED' } });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: { message: 'Login failed' } });
  }
});

// PUT /api/auth/profile — Update user profile
router.put(
  '/profile',
  authenticate,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(404).json({ error: { message: 'User not found' } });
      }

      const allowedFields = ['displayName', 'bio', 'avatarUrl', 'expertiseCategory', 'language', 'gender'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      // --- Weekly name change limit ---
      if (updates.displayName && updates.displayName !== req.user.displayName) {
        if (req.user.lastNameChange) {
          const daysSinceLastChange = (Date.now() - new Date(req.user.lastNameChange).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastChange < 7) {
            const daysLeft = Math.ceil(7 - daysSinceLastChange);
            return res.status(429).json({
              error: { message: `Name can only be changed once per week. Try again in ${daysLeft} day(s).` },
            });
          }
        }
        updates.lastNameChange = new Date();
      }

      // --- Bio limit: 150 chars for teachers ---
      if (updates.bio !== undefined) {
        if (updates.bio.length > 150) {
          updates.bio = updates.bio.substring(0, 150);
        }
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: { message: 'Profile update failed' } });
    }
  }
);

module.exports = router;
