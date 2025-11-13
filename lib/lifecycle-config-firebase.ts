/**
 * Firebase Lifecycle Configuration Store
 * Manages customizable production lifecycle stages per user in Firestore
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "@/lib/firebase"

export interface LifecycleStage {
  id: string
  name: string
  order: number
  color: string
  description?: string
  image?: string
  createdAt: string
  updatedAt: string
}

const DEFAULT_STAGES: Omit<LifecycleStage, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Calf", order: 1, color: "#3b82f6", description: "Newborn cattle", image: "/images/calf.png" },
  { name: "Weaned Calf", order: 2, color: "#8b5cf6", description: "Recently weaned", image: "/images/weaning.png" },
  { name: "Yearling", order: 3, color: "#ec4899", description: "Second year of life", image: "/images/yearling.png" },
  { name: "Breeding", order: 4, color: "#10b981", description: "Reproduction cycle", image: "/images/breeding.png" },
  { name: "Finishing", order: 5, color: "#f59e0b", description: "Prepared for market", image: "/images/cow.png" },
]

class FirebaseLifecycleConfigStore {
  private stages: LifecycleStage[] = []
  private listeners: Set<() => void> = new Set()
  private authReady: boolean = false
  private authReadyPromise: Promise<void>

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

  async loadStages(): Promise<void> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) {
      console.log("No user logged in, using default stages")
      this.stages = []
      return
    }

    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/lifecycleStages`))

      if (snapshot.empty) {
        // First time loading - initialize with default stages
        console.log("No lifecycle stages found, initializing defaults")
        await this.initializeDefaultStages()
      } else {
        this.stages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LifecycleStage))
        this.notifyListeners()
      }
    } catch (error) {
      console.error("Error loading lifecycle stages:", error)
      this.stages = []
    }
  }

  private async initializeDefaultStages(): Promise<void> {
    const userId = this.getUserId()
    if (!userId) return

    const now = new Date().toISOString()
    const newStages: LifecycleStage[] = []

    try {
      for (const defaultStage of DEFAULT_STAGES) {
        const id = `stage_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const stage: LifecycleStage = {
          ...defaultStage,
          id,
          createdAt: now,
          updatedAt: now,
        }

        const docRef = doc(db, `users/${userId}/lifecycleStages`, id)
        await setDoc(docRef, stage)
        newStages.push(stage)
      }

      this.stages = newStages
      this.notifyListeners()
    } catch (error) {
      console.error("Error initializing default stages:", error)
    }
  }

  getStages(): LifecycleStage[] {
    return [...this.stages].sort((a, b) => a.order - b.order)
  }

  getStageNames(): string[] {
    return this.getStages().map((s) => s.name)
  }

  getStageById(id: string): LifecycleStage | undefined {
    return this.stages.find((s) => s.id === id)
  }

  getStageByName(name: string): LifecycleStage | undefined {
    return this.stages.find((s) => s.name.toLowerCase() === name.toLowerCase())
  }

  async addStage(stage: Omit<LifecycleStage, "id" | "order" | "createdAt" | "updatedAt">): Promise<LifecycleStage> {
    await this.waitForAuth()
    const userId = this.getUserId()

    if (!userId) {
      console.error("Add stage failed: No user ID available. Auth state:", {
        authReady: this.authReady,
        currentUser: auth.currentUser,
      })
      throw new Error("Not authenticated")
    }

    const now = new Date().toISOString()
    const id = `stage_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newStage: LifecycleStage = {
      ...stage,
      id,
      order: this.stages.length + 1,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/lifecycleStages`, id)
      await setDoc(docRef, newStage)
      this.stages.push(newStage)
      this.notifyListeners()
      console.log("Stage added successfully:", newStage.name)
      return newStage
    } catch (error) {
      console.error("Error adding lifecycle stage:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to add lifecycle stage")
    }
  }

  async updateStage(id: string, updates: Partial<Omit<LifecycleStage, "id" | "createdAt">>): Promise<boolean> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) {
      console.error("Update stage failed: No user ID available")
      throw new Error("Not authenticated")
    }

    const index = this.stages.findIndex((s) => s.id === id)
    if (index === -1) {
      console.error("Update stage failed: Stage not found:", id)
      throw new Error("Stage not found")
    }

    try {
      const docRef = doc(db, `users/${userId}/lifecycleStages`, id)
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(docRef, updateData)
      this.stages[index] = { ...this.stages[index], ...updateData }
      this.notifyListeners()
      console.log("Stage updated successfully:", this.stages[index].name)
      return true
    } catch (error) {
      console.error("Error updating lifecycle stage:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to update lifecycle stage")
    }
  }

  async removeStage(id: string): Promise<boolean> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) {
      console.error("Remove stage failed: No user ID available")
      throw new Error("Not authenticated")
    }

    const index = this.stages.findIndex((s) => s.id === id)
    if (index === -1) {
      console.error("Remove stage failed: Stage not found:", id)
      throw new Error("Stage not found")
    }

    try {
      const docRef = doc(db, `users/${userId}/lifecycleStages`, id)
      await deleteDoc(docRef)

      const removedStageName = this.stages[index].name
      this.stages.splice(index, 1)

      // Reorder remaining stages
      for (let i = 0; i < this.stages.length; i++) {
        if (this.stages[i].order !== i + 1) {
          await this.updateStage(this.stages[i].id, { order: i + 1 })
        }
      }

      this.notifyListeners()
      console.log("Stage removed successfully:", removedStageName)
      return true
    } catch (error) {
      console.error("Error removing lifecycle stage:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to remove lifecycle stage")
    }
  }

  async reorderStages(stageIds: string[]): Promise<void> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) {
      console.error("Reorder stages failed: No user ID available")
      throw new Error("Not authenticated")
    }

    const reordered = stageIds
      .map((id) => this.stages.find((s) => s.id === id))
      .filter((s): s is LifecycleStage => s !== undefined)

    if (reordered.length !== this.stages.length) {
      console.error("Invalid reorder operation: Mismatch in stage count")
      throw new Error("Invalid reorder operation")
    }

    try {
      // Update order in Firestore
      for (let i = 0; i < reordered.length; i++) {
        const stage = reordered[i]
        if (stage.order !== i + 1) {
          const docRef = doc(db, `users/${userId}/lifecycleStages`, stage.id)
          await updateDoc(docRef, { order: i + 1, updatedAt: new Date().toISOString() })
          stage.order = i + 1
        }
      }

      this.stages = reordered
      this.notifyListeners()
      console.log("Stages reordered successfully")
    } catch (error) {
      console.error("Error reordering lifecycle stages:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to reorder lifecycle stages")
    }
  }

  async resetToDefault(): Promise<void> {
    await this.waitForAuth()
    const userId = this.getUserId()
    if (!userId) {
      console.error("Reset stages failed: No user ID available")
      throw new Error("Not authenticated")
    }

    try {
      // Delete all existing stages
      const snapshot = await getDocs(collection(db, `users/${userId}/lifecycleStages`))
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref)
      }

      // Reinitialize with defaults
      this.stages = []
      await this.initializeDefaultStages()
      console.log("Stages reset to default successfully")
    } catch (error) {
      console.error("Error resetting lifecycle stages:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to reset lifecycle stages")
    }
  }
}

export const firebaseLifecycleConfig = new FirebaseLifecycleConfigStore()
