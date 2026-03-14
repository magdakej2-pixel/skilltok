const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Auth middleware: Verifies Firebase token and attaches user to request.
 * Expects header: Authorization: Bearer <firebase_id_token>
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'No token provided' } });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find user in MongoDB by Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      // User exists in Firebase but not in MongoDB yet (first login)
      req.firebaseUser = decodedToken;
      req.user = null;
    } else {
      req.firebaseUser = decodedToken;
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
};

/**
 * Requires user to exist in MongoDB (must have completed registration)
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: { message: 'User registration incomplete' } });
  }
  next();
};

/**
 * Requires user to have teacher role
 */
const requireTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: { message: 'Teacher access required' } });
  }
  next();
};

/**
 * Optional auth: tries to verify Firebase token and attach user,
 * but continues without error if no token is present.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    req.firebaseUser = decodedToken;
    req.user = user || null;
  } catch {
    req.user = null;
    req.firebaseUser = null;
  }
  next();
};

module.exports = { authenticate, requireUser, requireTeacher, optionalAuth };
