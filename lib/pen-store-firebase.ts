/**
 * Firebase Pen/Barn Store
 * Handles barn/pen hierarchy and cattle assignments
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "@/lib/firebase"

export interface Pen {
  id: string
  name: string
  barnId: string
  capacity: number
  currentCount: number
  totalValue?: number  // Total value of all cattle in this pen
  location?: {
    x: number
    y: number
    width: number
    height: number
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Barn {
  id: string
  name: string
  location: string
  totalPens: number
  totalCapacity: number
  notes?: string
  createdAt: string
  updatedAt: string
}

class FirebasePenStore {
  private pens: Pen[] = []
  private barns: Barn[] = []
  private listeners: Set<() => void> = new Set()
  private authReady: boolean = false
  private authReadyPromise: Promise<void>
  private userId: string | null = null
  private unsubscribePens?: () => void
  private unsubscribeBarns?: () => void

  constructor() {
    // Wait for auth to be ready
    this.authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        this.authReady = true
        unsubscribe()
        resolve()
      })
    })
  }

  private async waitForAuth(): Promise<void> {
    if (!this.authReady) {
      await this.authReadyPromise
    }
  }

  private getUserId(): string | null {
    return auth.currentUser?.uid || null
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Initialize with user ID and set up real-time listeners
   */
  async initialize(userId: string): Promise<void> {
    if (this.userId === userId && this.unsubscribePens && this.unsubscribeBarns) {
      return // Already initialized for this user
    }

    // Clean up previous listeners
    this.cleanup()

    this.userId = userId

    // Set up real-time listener for barns
    const barnsRef = collection(db, `users/${userId}/barns`)
    this.unsubscribeBarns = onSnapshot(barnsRef, (snapshot) => {
      this.barns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Barn))
      this.notifyListeners()
    }, (error) => {
      console.error("Error in barns listener:", error)
    })

    // Set up real-time listener for pens
    const pensRef = collection(db, `users/${userId}/pens`)
    this.unsubscribePens = onSnapshot(pensRef, (snapshot) => {
      this.pens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pen))
      this.notifyListeners()
    }, (error) => {
      console.error("Error in pens listener:", error)
    })
  }

  /**
   * Clean up listeners when user logs out
   */
  cleanup(): void {
    if (this.unsubscribePens) {
      this.unsubscribePens()
      this.unsubscribePens = undefined
    }
    if (this.unsubscribeBarns) {
      this.unsubscribeBarns()
      this.unsubscribeBarns = undefined
    }
    this.pens = []
    this.barns = []
    this.userId = null
  }

  // BARNS
  /**
   * Load barns (always fetch fresh from Firestore for realtime data)
   */
  async loadBarns() {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) return

    // Always fetch fresh data from Firestore
    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/barns`))
      this.barns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Barn))
      this.notifyListeners()
    } catch (error) {
      console.error("Error loading barns:", error)
      this.barns = []
    }
  }

  getBarns(): Barn[] {
    return this.barns
  }

  async addBarn(barn: Omit<Barn, "id" | "createdAt" | "updatedAt">): Promise<Barn> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated. Please log in and try again.")

    const now = new Date().toISOString()
    const id = `barn_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newBarn: Barn = {
      ...barn,
      id,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/barns`, id)
      // Filter out undefined values for Firestore
      const barnData = Object.fromEntries(
        Object.entries(newBarn).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, barnData)
      // Real-time listener will update local state automatically
      return newBarn
    } catch (error: any) {
      console.error("Firebase addBarn error:", error)
      throw new Error(error?.message || "Failed to create barn. Please check your connection and try again.")
    }
  }

  async updateBarn(id: string, updates: Partial<Barn>): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/barns`, id)

      // Prepare update data with timestamp
      const updateDataWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      // Filter out undefined values for Firestore
      const updateData = Object.fromEntries(
        Object.entries(updateDataWithTimestamp).filter(([_, v]) => v !== undefined)
      )

      await updateDoc(docRef, updateData)
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error("Error updating barn:", error)
      throw new Error("Failed to update barn")
    }
  }

  async deleteBarn(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/barns`, id)
      await deleteDoc(docRef)
      // Real-time listener will update local state automatically
      // Note: Pens in this barn should be deleted separately or handled with Cloud Functions
    } catch (error) {
      throw new Error("Failed to delete barn")
    }
  }

  // PENS
  /**
   * Load pens (always fetch fresh from Firestore for realtime data)
   */
  async loadPens() {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) return

    // Always fetch fresh data from Firestore
    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/pens`))
      this.pens = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Pen))
      this.notifyListeners()
    } catch (error) {
      console.error("Error loading pens:", error)
      this.pens = []
    }
  }

  getPens(barnId?: string): Pen[] {
    if (barnId) {
      return this.pens.filter((p) => p.barnId === barnId)
    }
    return this.pens
  }

  getPen(id: string): Pen | undefined {
    return this.pens.find((p) => p.id === id)
  }

  getBarn(id: string): Barn | undefined {
    return this.barns.find((b) => b.id === id)
  }

  async addPen(pen: Omit<Pen, "id" | "createdAt" | "updatedAt">): Promise<Pen> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated. Please log in and try again.")

    const now = new Date().toISOString()
    const id = `pen_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newPen: Pen = {
      ...pen,
      id,
      currentCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/pens`, id)
      // Filter out undefined values for Firestore
      const penData = Object.fromEntries(
        Object.entries(newPen).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, penData)
      // Real-time listener will update local state automatically
      return newPen
    } catch (error: any) {
      console.error("Firebase addPen error:", error)
      throw new Error(error?.message || "Failed to create pen. Please check your connection and try again.")
    }
  }

  async updatePen(id: string, updates: Partial<Pen>): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/pens`, id)

      // Prepare update data with timestamp
      const updateDataWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      // Filter out undefined values for Firestore
      const updateData = Object.fromEntries(
        Object.entries(updateDataWithTimestamp).filter(([_, v]) => v !== undefined)
      )

      await updateDoc(docRef, updateData)
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error("Error updating pen:", error)
      throw new Error("Failed to update pen")
    }
  }

  async updatePenCount(penId: string, countChange: number): Promise<void> {
    const pen = this.pens.find((p) => p.id === penId)
    if (pen) {
      const newCount = Math.max(0, pen.currentCount + countChange)
      await this.updatePen(penId, { currentCount: newCount })
    }
  }

  async deletePen(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/pens`, id)
      await deleteDoc(docRef)
      // Real-time listener will update local state automatically
    } catch (error) {
      throw new Error("Failed to delete pen")
    }
  }

  // ANALYTICS
  getPenAnalytics(barnId?: string) {
    const relevantPens = barnId ? this.getPens(barnId) : this.pens

    const totalPens = relevantPens.length
    const totalCapacity = relevantPens.reduce((sum, p) => sum + p.capacity, 0)
    const totalOccupied = relevantPens.reduce((sum, p) => sum + p.currentCount, 0)
    const utilizationRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0

    return {
      totalPens,
      totalCapacity,
      totalOccupied,
      utilizationRate,
    }
  }
}

export const firebasePenStore = new FirebasePenStore()
