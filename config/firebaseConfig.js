import { readFileSync } from "fs";
import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  readFileSync("./apex-biotics-firebase-adminsdk-fbsvc-19a4b06da4.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
}

export default admin;
