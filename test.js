import admin from "firebase-admin";
import fs from "fs";

// 👀 Debug: show which key is being loaded
const keyPath = "./apex-biotics-50aaad5e911e.json";
console.log("Loading service account key from:", keyPath);
console.log(fs.readFileSync(keyPath, "utf8").slice(0, 200), "..."); // show first 200 chars

// Load service account JSON
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Test: generate an access token
admin.app().options.credential.getAccessToken()
  .then(token => {
    console.log("✅ Successfully generated access token:", token.access_token.slice(0, 30), "...");
  })
  .catch(err => {
    console.error("❌ Failed to generate token:", err);
  });
