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
const testDeviceToken = "dGKOc8F_Q1OOkjPOHOX7YN:APA91bEnUQW0l__CMpHIi3tR6HQKAC9g38tBBQDJusXsej8i9v1E2mbGXo5d1DBVN4IfccuISFH1VqUZoKh35T_hs_5Dqyls7HwVNd-gNrzgF-fvfewp92M";

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
