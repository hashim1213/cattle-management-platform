import * as admin from "firebase-admin"

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to initialize with environment variables or service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined

    if (serviceAccount) {
      console.log('[Firebase Admin] Initializing with service account credentials')
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "cattleos",
      })
    } else {
      console.warn('[Firebase Admin] No service account found. Trying default credentials...')
      console.warn('[Firebase Admin] For local development, set FIREBASE_SERVICE_ACCOUNT in .env.local')
      console.warn('[Firebase Admin] See AGENT_SETUP.md for instructions')

      // Initialize with project ID only (works in Firebase hosting or with Application Default Credentials)
      admin.initializeApp({
        projectId: "cattleos",
      })
    }

    console.log('[Firebase Admin] Successfully initialized')
  } catch (error) {
    console.error("[Firebase Admin] Error initializing Firebase Admin:", error)
    console.error("[Firebase Admin] Make sure FIREBASE_SERVICE_ACCOUNT is set in .env.local")
    console.error("[Firebase Admin] See AGENT_SETUP.md for setup instructions")
  }
}

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

export default admin
