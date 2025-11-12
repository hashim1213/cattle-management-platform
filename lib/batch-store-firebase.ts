/**
 * Firebase Batch Store
 * Manages cattle batches/lots
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export interface Batch {
  id: string
  name: string
  arrivalDate: string
  sourceLocation?: string
  purchasePrice?: number
  averageWeight?: number
  headCount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

class FirebaseBatchStore {
  private batches: Batch[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    // Data will be loaded when user is authenticated
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

  async loadBatches() {
    const userId = this.getUserId()
    if (!userId) return

    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/batches`))
      this.batches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Batch))
      this.notifyListeners()
    } catch (error) {
      this.batches = []
    }
  }

  getBatches(): Batch[] {
    return this.batches
  }

  async addBatch(batch: Omit<Batch, "id" | "createdAt" | "updatedAt">): Promise<Batch> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const now = new Date().toISOString()
    const id = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newBatch: Batch = {
      ...batch,
      id,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/batches`, id)
      await setDoc(docRef, newBatch)
      this.batches.push(newBatch)
      this.notifyListeners()
      return newBatch
    } catch (error) {
      throw new Error("Failed to add batch")
    }
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/batches`, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      const index = this.batches.findIndex((b) => b.id === id)
      if (index !== -1) {
        this.batches[index] = { ...this.batches[index], ...updates }
        this.notifyListeners()
      }
    } catch (error) {
      throw new Error("Failed to update batch")
    }
  }

  async deleteBatch(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/batches`, id)
      await deleteDoc(docRef)
      this.batches = this.batches.filter((b) => b.id !== id)
      this.notifyListeners()
    } catch (error) {
      throw new Error("Failed to delete batch")
    }
  }
}

export const firebaseBatchStore = new FirebaseBatchStore()
