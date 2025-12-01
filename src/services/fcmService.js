import admin from "firebase-admin";

// Initialize Firebase Admin using a JSON string in env to avoid committing secrets
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin for FCM:", err);
  }
}

const isFcmConfigured = () => admin.apps.length > 0;

export const sendFCMNotification = async (fcmToken, notification) => {
  if (!isFcmConfigured()) {
    console.warn("FCM not configured; skipping push notification.");
    return { success: false, error: "FCM not configured" };
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type || "general",
        studentId: notification.relatedStudent || "",
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return { success: false, error: error.message };
  }
};


