import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyArBOx-POsmXttlvgDQ1tk0CWwF_GuW-qk",
  authDomain: "cattleos.firebaseapp.com",
  projectId: "cattleos",
  storageBucket: "cattleos.firebasestorage.app",
  messagingSenderId: "169828733805",
  appId: "1:169828733805:web:db73550312e9e0ebedc064",
  measurementId: "G-16M2TDXTP5"
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
