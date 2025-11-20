/**
 * Server-side Firebase utilities for API routes
 * This approach avoids needing Firebase Admin SDK service account credentials
 * by using the client's ID token for authentication
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let isInitialized = false
let initializationError: Error | null = null

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
      isInitialized = true
    } else {
      // Try Application Default Credentials (works in Firebase Hosting, Cloud Run, etc.)
      try {
        initializeApp({
          projectId: "cattleos",
        })
        console.log('[Firebase Server] Initialized with default credentials')
        isInitialized = true
      } catch (adcError: any) {
        // ADC not available - this is expected in local development without service account
        console.warn('[Firebase Server] Application Default Credentials not available')
        console.warn('[Firebase Server] To use the Farm Assistant locally, set FIREBASE_SERVICE_ACCOUNT in .env.local')
        console.warn('[Firebase Server] See .env.example for instructions')
        initializationError = new Error(
          'Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable. See .env.example for setup instructions.'
        )
      }
    }
  } catch (error: any) {
    console.error('[Firebase Server] Initialization error:', error)
    initializationError = error
  }
} else {
  // Already initialized from a previous import
  isInitialized = true
}

export const serverDb = isInitialized ? getFirestore() : null as any
export const serverAuth = isInitialized ? getAuth() : null as any

/**
 * Check if Firebase Admin SDK is properly initialized
 */
export function checkFirebaseInitialization(): void {
  if (!isInitialized || !serverDb || !serverAuth) {
    throw new Error(
      initializationError?.message ||
      'Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable. See .env.example for setup instructions.'
    )
  }
}

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
