const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Like = require('../models/Like');
const SavedVideo = require('../models/SavedVideo');
const Follow = require('../models/Follow');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const VideoView = require('../models/VideoView');
const Donation = require('../models/Donation');
const admin = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { stripHtml } = require('../middleware/validate');

// POST /api/auth/register — Create user in MongoDB after Firebase registration
router.post(
  '/register',

  authenticate,
  [
    body('displayName').trim().notEmpty().isLength({ max: 50 }).customSanitizer(stripHtml).withMessage('Display name is required (max 50 chars)'),
    body('role').isIn(['teacher', 'student']).withMessage('Role must be teacher or student'),
    body('language').optional().isIn(['en', 'pl', 'zh']),
    body('bio').optional().isLength({ max: 150 }).customSanitizer(stripHtml),
    body('expertiseCategory').optional().isLength({ max: 50 }).customSanitizer(stripHtml),
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
      console.error('Register error:', error.message);
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

      const allowedFields = ['displayName', 'bio', 'avatarUrl', 'expertiseCategory', 'language', 'gender', 'settings'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      // Sanitize text fields against XSS
      if (updates.displayName) updates.displayName = stripHtml(updates.displayName).slice(0, 50);
      if (updates.bio !== undefined) updates.bio = stripHtml(updates.bio);
      if (updates.avatarUrl && !/^https:\/\//i.test(updates.avatarUrl)) {
        return res.status(400).json({ error: { message: 'Avatar URL must use HTTPS' } });
      }

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

      // --- Merge settings (don't overwrite entire sub-doc) ---
      if (updates.settings && typeof updates.settings === 'object') {
        const allowedSettingsKeys = [
          'pushNotifications', 'emailNotifications', 'autoplay', 'dataSaver',
          'privateAccount', 'allowComments', 'allowMessages', 'allowDuets', 'downloadWifiOnly'
        ];
        const existingSettings = req.user.settings || {};
        const mergedSettings = { ...existingSettings };
        for (const key of allowedSettingsKeys) {
          if (updates.settings[key] !== undefined) {
            mergedSettings[key] = Boolean(updates.settings[key]);
          }
        }
        updates.settings = mergedSettings;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: { message: 'Profile update failed' } });
    }
  }
);

// DELETE /api/auth/account — Delete user account entirely
router.delete('/account', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const userId = req.user._id;
    const firebaseUid = req.user.firebaseUid;

    // Delete all related data (including new security-model collections)
    await Promise.all([
      Video.deleteMany({ teacherId: userId }),
      Like.deleteMany({ userId }),
      SavedVideo.deleteMany({ userId }),
      Follow.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }),
      Comment.deleteMany({ userId }),
      CommentLike.deleteMany({ userId }),
      VideoView.deleteMany({ viewerKey: `user:${userId}` }),
      Donation.updateMany({ userId }, { userId: null, anonymous: true }),
    ]);

    // Delete user from MongoDB
    await User.findByIdAndDelete(userId);

    // Delete from Firebase
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch (fbErr) {
      console.error('Firebase user deletion error:', fbErr.message);
    }

    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: { message: 'Account deletion failed' } });
  }
});

module.exports = router;
