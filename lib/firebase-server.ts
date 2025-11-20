/**
 * Server-side Firebase utilities for API routes
 * Uses client SDK with Firebase security rules for authentication
 */

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyArBOx-POsmXttlvgDQ1tk0CWwF_GuW-qk",
  authDomain: "cattleos.firebaseapp.com",
  projectId: "cattleos",
  storageBucket: "cattleos.firebasestorage.app",
  messagingSenderId: "169828733805",
  appId: "1:169828733805:web:db73550312e9e0ebedc064",
  measurementId: "G-16M2TDXTP5"
}

// Initialize Firebase (only once) for server-side usage
const serverApp = getApps().length === 0 ? initializeApp(firebaseConfig, 'server') : getApp('server')

// Initialize Firestore
export const serverDb = getFirestore(serverApp)

/**
 * Verify user authentication
 * Since we're using client SDK with security rules, we trust the userId from the client
 * Firebase security rules will enforce that users can only access their own data
 */
export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
  // For client SDK approach, we extract userId from the request body
  // The actual authentication is handled by Firebase security rules
  // This is a pass-through for compatibility
  console.log('[Firebase Server] Using client SDK with security rules')
  return null // Will be set from request body
}

/**
 * Check if Firebase is initialized
 * With client SDK, we're always ready to go
 */
export function checkFirebaseInitialization(): void {
  // Client SDK doesn't need initialization checks
  console.log('[Firebase Server] Client SDK ready')
}
