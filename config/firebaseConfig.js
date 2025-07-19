// src/config/firebaseConfig.js
import admin from 'firebase-admin';
import { serviceAccount } from './firebaseServiceAccount.js';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export default admin;