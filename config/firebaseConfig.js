import admin from 'firebase-admin';
import { serviceAccount } from './firebaseServiceAccount.js';
import path from "path";

try {
  if (!admin.apps.length) {
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    admin.initializeApp({
        credential: admin.credential.cert(path.join('apex-biotics-firebase-adminsdk-fbsvc-19a4b06da4.json')),
      });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export default admin;
