import admin from '../config/firebaseConfig.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import path from "path";


// utils/notificationService.js
// import admin from "firebase-admin";
// import serviceAccount from "../config/firebaseServiceAccountKey.json"; // apni file ka path sahi rakho

if (!admin.apps.length) {
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  // });
  admin.initializeApp({
      credential: admin.credential.cert(path.join('apex-biotics-firebase-adminsdk-fbsvc-19a4b06da4.json')),
    });
}

const messaging = admin.messaging();

export const sendNotification = async ({
  userId,
  title,
  message,
  type,
  supplementId,
}) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);

    if (!user || !user.deviceToken){ 
      return;
    }

    const payload = {
      token: user.deviceToken,
      notification: {
        title,
        body: message,
      },
      data: {
        type,
        supplementId: supplementId?.toString() || "",
      },
    };

    const response = await messaging.send(payload);
    console.log("Notification gaya:", response);
  } catch (error) {
    console.error("Notification bhejne mein error:", error);
  }
};

const getCurrentUKDateTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  console.log(🔔 SEND NOTIFICATION: Starting at ${getCurrentUKDateTime().toISOString()} UK time for user: ${userId});
  console.log(📝 DETAILS: Title: "${title}", Body: "${body}");

  try {
    if (!userId || typeof userId === 'object') {
      if (typeof userId === 'object' && userId._id) {
        userId = userId._id.toString();
      } else {
        console.error(❌ ERROR: Invalid user ID provided:, userId);
        return false;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(❌ ERROR: User not found with ID: ${userId});
      return false;
    }

    if (!user.notificationSettings || !user.notificationSettings.pushEnabled) {
      console.log(ℹ INFO: Push notifications disabled for user: ${userId});
      return false;
    }

    if (!user.deviceToken) {
      console.log(ℹ INFO: No device token found for user: ${userId});
      return false;
    }

    console.log(📱 DEVICE TOKEN: ${user.deviceToken.substring(0, 10)}...);

    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] = String(value);
    }
    stringifiedData.sentAt = getCurrentUKDateTime().toISOString();
    stringifiedData.timezone = 'Europe/London';

    const message = {
      notification: { title, body },
      data: stringifiedData,
      token: user.deviceToken,
      android: { priority: "high", ttl: 60 * 60 * 24, notification: { channelId: "supplement_reminders", clickAction: "SUPPLEMENT_REMINDER" } },
      apns: { headers: { "apns-priority": "10", "apns-push-type": "alert" }, payload: { aps: { sound: "default", badge: 1, contentAvailable: true, category: "SUPPLEMENT_REMINDER" } } },
      webpush: { headers: { Urgency: "high" } },
    };

    // Save notification to database
    const notification = new Notification({
      user: userId,
      title,
      message: body,
      type: data.type || 'SYSTEM',
      relatedId: data.supplementId || null,
      sentAt: new Date()
    });
    await notification.save();

    console.log(📤 SENDING MESSAGE: To FCM for user ${userId});
    const response = await admin.messaging().send(message);
    console.log(✅ SUCCESS: Notification sent. Response: ${response});
    return true;
  } catch (error) {
    console.error(❌ ERROR: Failed to send notification:, error);
    if (error.code === 'messaging/registration-token-not-registered') {
      console.error(❌ TOKEN EXPIRED: Removing invalid token);
      await User.findByIdAndUpdate(userId, { Manufactured: null });
    }
    return false;
  }
};   

export const sendTestNotification = async (userId) => {
  return sendPushNotification(
    userId,
    "Test Notification",
    "This is a test notification to verify your device is properly configured",
    { type: "TEST_NOTIFICATION" }
  );
};

export const validateDeviceToken = async (userId, deviceToken) => {
  try {
    console.log(🔍 VALIDATING TOKEN: For user ${userId} at ${getCurrentUKDateTime().toISOString()} UK time);
    const message = {
      data: { type: "VALIDATE_TOKEN", timestamp: String(Date.now()) },
      token: deviceToken,
      apns: { payload: { aps: { contentAvailable: true } }, headers: { "apns-priority": "5", "apns-push-type": "background" } },
      android: { priority: "normal", ttl: 60, directBootOk: true },
    };
    const response = await admin.messaging().send(message);
    console.log(✅ TOKEN VALID: Silent notification sent successfully);
    return true;
  } catch (error) {
    console.error(❌ TOKEN INVALID: Failed to validate device token:, error);
    return false;
  }
};
notification.service.js
