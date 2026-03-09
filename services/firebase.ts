// Firebase configuration for the frontend (Expo)
// Replace these values with your Firebase project config from console.firebase.google.com
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:xxxxxxxxxxxx',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth — platform-aware persistence
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence);
} else {
  // On native, use AsyncStorage-based persistence
  const { getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firebase Storage
const storage = getStorage(app);

export { app, auth, storage };
export default app;
