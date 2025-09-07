// utils/firebase.js
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.resolve("firebase-service-account.json"), "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
