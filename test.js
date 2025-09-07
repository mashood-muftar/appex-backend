const admin = require("firebase-admin");
const fs = require("fs");

// 👀 Debug: show which key is being loaded
const keyPath = "./apex-biotics-50aaad5e911e.json";
console.log("Loading service account key from:", keyPath);
console.log(fs.readFileSync(keyPath, "utf8").slice(0, 200), "..."); // show first 200 chars

// Initialize Firebase
const serviceAccount = require(keyPath);

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
