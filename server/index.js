const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
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
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;
const webappDir = path.join(__dirname, 'webapp');

// ── Static sites: served BEFORE helmet ──
app.use('/landing', express.static(path.join(__dirname, 'landing')));
app.use('/fonts', express.static(path.join(webappDir, 'fonts'), {
  maxAge: '30d',
  immutable: true,
}));
app.use(express.static(webappDir));

// ── API Middleware ──
const rateLimit = require('express-rate-limit');

// Rate limiters
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: { message: 'Too many auth requests, try again later' } } });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: { message: 'Too many requests, slow down' } } });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: { message: 'Rate limit exceeded' } } });

app.use('/api', helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Restrict CORS to known origins
const allowedOrigins = [
  'https://quelio-api.onrender.com',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:19006',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// ── Stripe webhook needs raw body — mount BEFORE express.json ──
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Apply rate limiters to API routes
app.use('/api/auth', authLimiter);
app.use('/api/videos', writeLimiter);
app.use('/api/messages', writeLimiter);
app.use('/api/donations', writeLimiter);
app.use('/api', generalLimiter);

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
app.use('/api/upload', uploadRoutes);

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

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(webappDir, 'index.html'));
});

// ── Raw HTTP server with URL rewriting for @expo font paths ──
// Express 5 rejects URLs containing @ before ANY middleware runs.
// We intercept at the Node.js http level and rewrite .ttf URLs to /fonts/
const server = http.createServer((req, res) => {
  const decoded = decodeURIComponent(req.url);
  
  // Rewrite .ttf requests: extract filename, serve from /fonts/
  if (decoded.includes('.ttf')) {
    const urlPath = decoded.split('?')[0];
    const basename = path.basename(urlPath);
    const fontPath = path.join(webappDir, 'fonts', basename);
    if (fs.existsSync(fontPath)) {
      req.url = '/fonts/' + basename;
    }
  }
  
  // Pass to Express
  app(req, res);
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skilltok')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
