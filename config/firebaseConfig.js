import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve('apex-biotics-firebase-adminsdk-fbsvc-19a4b06da4.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized successfully');
}

export default admin;
