import * as admin from "firebase-admin"

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to initialize with environment variables or service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "cattleos",
      })
    } else {
      // Initialize with project ID only (works in Firebase hosting or with Application Default Credentials)
      admin.initializeApp({
        projectId: "cattleos",
      })
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error)
  }
}

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

export default admin
