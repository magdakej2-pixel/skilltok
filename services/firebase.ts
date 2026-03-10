// Firebase configuration for the frontend (Expo)
// Replace these values with your Firebase project config from console.firebase.google.com
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBsLW6GINIluKiEbI4X_85AjRK1QbjRHwo',
  authDomain: 'skilltok-5053f.firebaseapp.com',
  projectId: 'skilltok-5053f',
  storageBucket: 'skilltok-5053f.firebasestorage.app',
  messagingSenderId: '407572820644',
  appId: '1:407572820644:web:6f3d6d1c4a961455682c31',
  measurementId: 'G-W48M279K6W',
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
