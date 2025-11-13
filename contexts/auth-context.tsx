"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { firebaseInventoryService } from "@/lib/inventory/inventory-service-firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signup: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Initialize real-time listeners for all data stores
        try {
          await Promise.all([
            firebaseDataStore.initialize(user.uid),
            firebasePenStore.initialize(user.uid),
            firebaseInventoryService.initialize(user.uid),
          ])
        } catch (error) {
          console.error("Error initializing data stores:", error)
        }
      } else {
        // Clean up listeners when user logs out
        firebaseDataStore.cleanup()
        firebasePenStore.cleanup()
        firebaseInventoryService.cleanup()
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
