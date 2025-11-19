/**
 * Firebase Firestore Data Store
 * Manages all cattle-related data in Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

// Re-export types from original data-store
export interface Cattle {
  id: string
  tagNumber: string
  name?: string
  breed: string
  sex: "Bull" | "Cow" | "Steer" | "Heifer" | "Unknown"
  birthDate?: string
  purchaseDate?: string
  purchasePrice?: number
  purchaseWeight?: number
  currentValue?: number
  weight: number
  targetWeight?: number
  projectedWeight?: number
  daysOnFeed?: number
  dam?: string
  sire?: string
  conceptionMethod?: string
  lot: string
  lotNumber?: string
  pasture?: string
  penId?: string
  barnId?: string
  batchId?: string
  status: "Active" | "Sold" | "Deceased" | "Culled"
  stage: "Calf" | "Weaned Calf" | "Yearling" | "Breeding" | "Finishing" | "receiving"
  healthStatus: "Healthy" | "Sick" | "Treatment" | "Quarantine"
  pregnancyStatus?: "Open" | "Bred" | "Pregnant" | "Calved"
  expectedCalvingDate?: string
  lastVetVisit?: string
  notes?: string
  colorMarkings?: string
  hornStatus?: string
  identificationMethod: string
  rfidTag?: string
  visualTag?: string
  earTag?: string
  brand?: string
  brandNumber?: string
  arrivalDate?: string
  arrivalWeight?: number
  deathDate?: string
  deathReason?: string
  createdAt: string
  updatedAt: string
}

export interface WeightRecord {
  id: string
  cattleId: string
  date: string
  weight: number
  notes?: string
  createdAt: string
}

export interface HealthRecord {
  id: string
  cattleId: string
  date: string
  type: "Vaccination" | "Treatment" | "Checkup" | "Surgery" | "Other"
  description: string
  veterinarian?: string
  cost?: number
  notes?: string
  createdAt: string
}

class FirebaseDataStore {
  private userId: string | null = null
  private cattle: Cattle[] = []
  private listeners = new Set<() => void>()
  private unsubscribeCattle?: () => void

  private getUserId(): string | null {
    return auth.currentUser?.uid || null
  }

  private getCattleCollection(userId: string) {
    return collection(db, `users/${userId}/cattle`)
  }

  private getWeightRecordsCollection(userId: string, cattleId: string) {
    return collection(db, `users/${userId}/cattle/${cattleId}/weightRecords`)
  }

  private getHealthRecordsCollection(userId: string, cattleId: string) {
    return collection(db, `users/${userId}/cattle/${cattleId}/healthRecords`)
  }

  /**
   * Initialize with user ID and set up real-time listeners
   */
  async initialize(userId: string): Promise<void> {
    if (this.userId === userId && this.unsubscribeCattle) {
      return // Already initialized for this user
    }

    // Clean up previous listeners
    this.cleanup()

    this.userId = userId

    // Set up real-time listener for cattle
    const cattleRef = this.getCattleCollection(userId)
    this.unsubscribeCattle = onSnapshot(cattleRef, (snapshot) => {
      this.cattle = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Cattle))
      this.notify()
    }, (error) => {
      console.error("Error in cattle listener:", error)
    })
  }

  /**
   * Clean up listeners when user logs out
   */
  cleanup(): void {
    if (this.unsubscribeCattle) {
      this.unsubscribeCattle()
      this.unsubscribeCattle = undefined
    }
    this.cattle = []
    this.userId = null
  }

  /**
   * Subscribe to data changes
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  // CATTLE OPERATIONS
  /**
   * Get all cattle (always fetch fresh from Firestore for realtime data)
   */
  async getCattle(): Promise<Cattle[]> {
    const userId = this.getUserId()
    if (!userId) return []

    // Always fetch fresh data from Firestore
    try {
      const snapshot = await getDocs(this.getCattleCollection(userId))
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cattle))
    } catch (error) {
      console.error("Error fetching cattle:", error)
      return []
    }
  }

  async getCattleById(id: string): Promise<Cattle | null> {
    const userId = this.getUserId()
    if (!userId) return null

    // Always fetch fresh from Firestore
    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Cattle
      }
      return null
    } catch (error) {
      console.error("Error fetching cattle by ID:", error)
      return null
    }
  }

  async addCattle(cattle: Omit<Cattle, "id" | "createdAt" | "updatedAt">): Promise<Cattle> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const now = new Date().toISOString()
    const id = `cattle_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newCattle: Cattle = {
      ...cattle,
      id,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      // Filter out undefined values for Firestore
      const cattleData = Object.fromEntries(
        Object.entries(newCattle).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, cattleData)
      return newCattle
    } catch (error: any) {
      console.error("Failed to add cattle:", error)
      throw new Error(error?.message || "Failed to add cattle")
    }
  }

  async updateCattle(id: string, updates: Partial<Cattle>): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      // Filter out undefined values for Firestore
      const updateData = Object.fromEntries(
        Object.entries({
          ...updates,
          updatedAt: new Date().toISOString(),
        }).filter(([_, v]) => v !== undefined)
      )
      await updateDoc(docRef, updateData)
    } catch (error: any) {
      console.error("Failed to update cattle:", error)
      throw new Error(error?.message || "Failed to update cattle")
    }
  }

  async deleteCattle(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      await deleteDoc(docRef)
    } catch (error) {
      throw new Error("Failed to delete cattle")
    }
  }

  // WEIGHT RECORDS
  async getWeightRecords(cattleId: string): Promise<WeightRecord[]> {
    const userId = this.getUserId()
    if (!userId) return []

    try {
      const snapshot = await getDocs(this.getWeightRecordsCollection(userId, cattleId))
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WeightRecord))
    } catch (error) {
      return []
    }
  }

  async addWeightRecord(
    cattleId: string,
    record: Omit<WeightRecord, "id" | "cattleId" | "createdAt">
  ): Promise<WeightRecord> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const now = new Date().toISOString()
    const id = `weight_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newRecord: WeightRecord = {
      ...record,
      id,
      cattleId,
      createdAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/cattle/${cattleId}/weightRecords`, id)
      await setDoc(docRef, newRecord)
      return newRecord
    } catch (error) {
      throw new Error("Failed to add weight record")
    }
  }

  // HEALTH RECORDS
  async getAllHealthRecords(): Promise<HealthRecord[]> {
    const userId = this.getUserId()
    if (!userId) return []

    try {
      const allCattle = await this.getCattle()
      const allRecords: HealthRecord[] = []

      for (const cattle of allCattle) {
        const records = await this.getHealthRecords(cattle.id)
        allRecords.push(...records)
      }

      return allRecords.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    } catch (error) {
      console.error("Error loading all health records:", error)
      return []
    }
  }

  async getHealthRecords(cattleId: string): Promise<HealthRecord[]> {
    const userId = this.getUserId()
    if (!userId) return []

    try {
      const snapshot = await getDocs(this.getHealthRecordsCollection(userId, cattleId))
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HealthRecord))
    } catch (error) {
      return []
    }
  }

  async addHealthRecord(
    cattleId: string,
    record: Omit<HealthRecord, "id" | "cattleId" | "createdAt">
  ): Promise<HealthRecord> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const now = new Date().toISOString()
    const id = `health_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newRecord: HealthRecord = {
      ...record,
      id,
      cattleId,
      createdAt: now,
    }

    try {
      const docRef = doc(db, `users/${userId}/cattle/${cattleId}/healthRecords`, id)
      await setDoc(docRef, newRecord)
      return newRecord
    } catch (error) {
      throw new Error("Failed to add health record")
    }
  }

  // ANALYTICS
  async getAnalytics(marketPricePerLb: number = 6.97) {
    const cattle = await this.getCattle()
    const activeCattle = cattle.filter((c) => c.status === "Active")
    const deceasedCattle = cattle.filter((c) => c.status === "Deceased")

    const totalCattle = cattle.length
    const activeCattleCount = activeCattle.length
    const deceasedCount = deceasedCattle.length
    const healthyCount = cattle.filter((c) => c.healthStatus === "Healthy").length
    const sickCount = cattle.filter((c) => c.healthStatus === "Sick" || c.healthStatus === "Treatment").length

    // Calculate mortality rate (deceased / (active + deceased))
    const totalForMortality = activeCattleCount + deceasedCount
    const mortalityRate = totalForMortality > 0 ? (deceasedCount / totalForMortality) * 100 : 0

    // Calculate average weight
    const avgWeight = activeCattleCount > 0
      ? Math.round(activeCattle.reduce((sum, c) => sum + (c.weight || 0), 0) / activeCattleCount)
      : 0

    // Helper function to calculate days on feed
    const calculateDaysOnFeed = (cattle: any): number => {
      const startDate = cattle.arrivalDate || cattle.purchaseDate
      if (!startDate) return 0

      const start = new Date(startDate)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Calculate average daily gain using calculated daysOnFeed
    const cattleWithGain = activeCattle.filter(c => {
      const daysOnFeed = calculateDaysOnFeed(c)
      return (c.weight || 0) > 0 && (c.arrivalWeight || c.purchaseWeight || 0) > 0 && daysOnFeed > 0
    })

    const avgDailyGain = cattleWithGain.length > 0
      ? cattleWithGain.reduce((sum, c) => {
          const daysOnFeed = calculateDaysOnFeed(c)
          const startWeight = c.arrivalWeight || c.purchaseWeight || 0
          const gain = ((c.weight || 0) - startWeight) / daysOnFeed
          return sum + gain
        }, 0) / cattleWithGain.length
      : 0

    // Calculate total value (estimated market value)
    const totalValue = activeCattle.reduce((sum, c) => {
      return sum + ((c.weight || 0) * marketPricePerLb)
    }, 0)

    // Get health record costs for all cattle
    let totalHealthCosts = 0
    for (const c of activeCattle) {
      try {
        const healthRecords = await this.getHealthRecords(c.id)
        totalHealthCosts += healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
      } catch (error) {
        // Continue if health records can't be loaded
      }
    }

    // Calculate total inventory value (purchase price + health costs)
    // Note: Feed costs are stored separately in localStorage and not included here
    const totalInventoryValue = activeCattle.reduce((sum, c) => {
      return sum + (c.purchasePrice || 0)
    }, 0) + totalHealthCosts

    // Calculate cost per head
    const costPerHead = activeCattleCount > 0
      ? totalInventoryValue / activeCattleCount
      : 0

    // Cow-calf specific analytics (will show 0 for backgrounder operations)
    const bulls = {
      count: 0,
      herdSires: 0,
      herdSireProspects: 0,
    }
    const cows = {
      count: 0,
      pregnant: 0,
      open: 0,
      exposed: 0,
    }
    const calves = {
      count: 0,
      unweaned: 0,
      weaned: 0,
    }

    return {
      totalCattle,
      activeCattle: activeCattleCount,
      deceasedCount,
      mortalityRate: Number(mortalityRate.toFixed(2)),
      healthyCount,
      sickCount,
      avgWeight,
      avgDailyGain,
      totalValue: Math.round(totalValue),
      totalInventoryValue: Math.round(totalInventoryValue),
      costPerHead: Math.round(costPerHead),
      bulls,
      cows,
      calves,
    }
  }
}

export const firebaseDataStore = new FirebaseDataStore()
