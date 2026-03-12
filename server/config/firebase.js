const admin = require('firebase-admin');

// Parse Firebase private key from env — handles multiple formats
function parsePrivateKey(raw) {
  if (!raw) return undefined;
  let key = raw;
  // Strip surrounding double quotes (Render sometimes wraps values)
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  // Try JSON.parse for JSON-encoded strings (e.g. "-----BEGIN...\\n...-----END...\\n")
  try {
    key = JSON.parse(`"${key}"`);
  } catch {
    // fallback: replace literal \n with real newlines
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
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
