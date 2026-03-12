const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const videoRoutes = require('./routes/videos');
const categoryRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const monetizationRoutes = require('./routes/monetization');
const donationRoutes = require('./routes/donations');
const messageRoutes = require('./routes/messages');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Static sites: served BEFORE everything (no restrictive headers) ──
app.use('/landing', express.static(path.join(__dirname, 'landing')));

// Webapp static files
const webappDir = path.join(__dirname, 'webapp');
const fs = require('fs');
const mime = require('express').static.mime || { lookup: () => 'application/octet-stream' };

// Custom middleware: manually resolve and serve webapp asset files
// express.static fails with paths containing @ (e.g. @expo) on production
app.use((req, res, next) => {
  // Only handle GET requests for static assets
  if (req.method !== 'GET') return next();
  
  // URL-decode the path
  const decodedPath = decodeURIComponent(req.path);
  
  // Security: prevent path traversal
  if (decodedPath.includes('..')) return next();
  
  // Resolve to filesystem
  const filePath = path.join(webappDir, decodedPath);
  
  // Check that resolved path is still within webappDir
  if (!filePath.startsWith(webappDir)) return next();
  
  // Check if file exists (not directories)
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      // Set content type based on extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.ttf': 'font/ttf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.map': 'application/json',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // Cache static assets
      if (ext !== '.html') {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      }
      
      return res.sendFile(filePath);
    }
  } catch {
    // File doesn't exist, fall through
  }
  
  next();
});

// ── API Middleware ──
app.use('/api', helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/waitlist', waitlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// SPA fallback: only for routes that aren't assets or API
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(webappDir, 'index.html'));
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skilltok')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
