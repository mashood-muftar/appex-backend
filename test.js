import admin from "firebase-admin";
import fs from "fs";

// === 1. Load service account key ===
const keyPath = "./apex-biotics-50aaad5e911e.json"; // adjust path if needed
console.log("Loading service account key from:", keyPath);

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

// === 2. Initialize Firebase Admin ===
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// === 3. Test: Generate an access token ===
try {
  const token = await admin.app().options.credential.getAccessToken();
  console.log("✅ Successfully generated access token:", token.access_token.slice(0, 30), "...");
} catch (err) {
  console.error("❌ Failed to generate token:", err);
  process.exit(1);
}

// === 4. Send a test push notification ===
// Replace this with a real FCM token from your iOS/Android app
const testDeviceToken = "YOUR_FCM_DEVICE_TOKEN_HERE";

const message = {
  token: testDeviceToken,
  notification: {
    title: "🚀 Test Notification",
    body: "Hello from Firebase Admin SDK!",
  },
};

try {
  const response = await admin.messaging().send(message);
  console.log("✅ Push notification sent:", response);
} catch (err) {
  console.error("❌ Failed to send push:", err);
}
