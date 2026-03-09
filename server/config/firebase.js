const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, use service account credentials from environment variables
// In development, Firebase auth middleware will be bypassed if not configured
try {
  if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } else if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('⚠️  Firebase not configured — auth endpoints will not work. Set FIREBASE_PROJECT_ID in .env');
  }
} catch (error) {
  console.warn('⚠️  Firebase init failed:', error.message);
}

module.exports = admin;
