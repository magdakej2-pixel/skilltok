/**
 * Monetization Routes (DISABLED — Feature-gated for MVP)
 * 
 * These endpoints are stubs for future subscription/premium features.
 * All currently return 403 with a "feature not available" message.
 */
const express = require('express');
const router = express.Router();

const FEATURE_DISABLED_MSG = {
  error: {
    code: 'FEATURE_DISABLED',
    message: 'Monetization features are not available in the current version.',
  },
};

// GET /api/monetization/plans - List subscription plans
router.get('/plans', (req, res) => {
  res.status(403).json(FEATURE_DISABLED_MSG);
});

// POST /api/monetization/subscribe - Subscribe to a plan
router.post('/subscribe', (req, res) => {
  res.status(403).json(FEATURE_DISABLED_MSG);
});

// POST /api/monetization/cancel - Cancel subscription
router.post('/cancel', (req, res) => {
  res.status(403).json(FEATURE_DISABLED_MSG);
});

// GET /api/monetization/status - Check subscription status
router.get('/status', (req, res) => {
  res.status(403).json(FEATURE_DISABLED_MSG);
});

// POST /api/videos/:id/premium - Mark video as premium (teacher)
router.post('/videos/:id/premium', (req, res) => {
  res.status(403).json(FEATURE_DISABLED_MSG);
});

module.exports = router;
