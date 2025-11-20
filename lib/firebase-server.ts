/**
 * Server-side Firebase utilities for API routes
 * This approach avoids needing Firebase Admin SDK service account credentials
 * by using the client's ID token for authentication
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined

    if (serviceAccount) {
      // Use service account if available (local development)
      initializeApp({
        credential: cert(serviceAccount),
        projectId: "cattleos",
      })
      console.log('[Firebase Server] Initialized with service account')
    } else {
      // Use Application Default Credentials (works in Firebase Hosting, Cloud Run, etc.)
      initializeApp({
        projectId: "cattleos",
      })
      console.log('[Firebase Server] Initialized with default credentials')
    }
  } catch (error) {
    console.error('[Firebase Server] Initialization error:', error)
    // Initialize anyway - will try to use environment credentials
    try {
      initializeApp({
        projectId: "cattleos",
      })
    } catch (retryError) {
      console.error('[Firebase Server] Retry failed:', retryError)
    }
  }
}

export const serverDb = getFirestore()
export const serverAuth = getAuth()

/**
 * Verify Firebase ID token and return the user ID
 */
export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Firebase Server] No auth header or invalid format')
    return null
  }

  const idToken = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken)
    console.log('[Firebase Server] Token verified for user:', decodedToken.uid)
    return decodedToken.uid
  } catch (error) {
    console.error('[Firebase Server] Token verification failed:', error)
    return null
  }
}
