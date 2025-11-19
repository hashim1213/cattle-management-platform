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
  collectionGroup,
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
  private healthRecordsByAnimal = new Map<string, HealthRecord[]>()
  private unsubscribeHealthRecords = new Map<string, () => void>()

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
    // Clean up all health record listeners
    this.unsubscribeHealthRecords.forEach(unsub => unsub())
    this.unsubscribeHealthRecords.clear()
    this.healthRecordsByAnimal.clear()
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
   * Get all cattle from in-memory cache (updated by real-time listener)
   * This is much faster than fetching from Firestore and provides real-time data
   * If cache is empty (e.g., before initialization), fetch fresh from Firestore
   */
  async getCattle(): Promise<Cattle[]> {
    // Return cached data if available (updated by real-time listener)
    if (this.cattle.length > 0 || this.userId) {
      return this.cattle
    }

    // Fallback: Fetch from Firestore if not initialized
    const userId = this.getUserId()
    if (!userId) return []

    try {
      const snapshot = await getDocs(this.getCattleCollection(userId))
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cattle))
    } catch (error) {
      console.error("Error fetching cattle:", error)
      return []
    }
  }

  /**
   * Get cattle synchronously from cache (for real-time updates)
   * Returns empty array if not initialized
   */
  getCattleSync(): Cattle[] {
    return this.cattle
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
      // Filter out undefined values for Firestore
      const recordData = Object.fromEntries(
        Object.entries(newRecord).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, recordData)
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
      // Use collectionGroup to query all healthRecords across all cattle in one query
      // This replaces the N+1 query pattern (1 query per cattle) with a single query
      const q = query(
        collectionGroup(db, 'healthRecords'),
        where('__name__', '>=', `users/${userId}/cattle/`),
        where('__name__', '<', `users/${userId}/cattle/\uf8ff`)
      )

      const snapshot = await getDocs(q)

      const allRecords = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as HealthRecord))

      return allRecords.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    } catch (error) {
      console.error("Error loading all health records:", error)
      return []
    }
  }

  /**
   * Subscribe to real-time health records for a specific cattle
   * Returns an unsubscribe function
   */
  subscribeToHealthRecords(cattleId: string): () => void {
    const userId = this.getUserId()
    if (!userId) return () => {}

    // Clean up existing subscription for this animal if it exists
    if (this.unsubscribeHealthRecords.has(cattleId)) {
      this.unsubscribeHealthRecords.get(cattleId)?.()
    }

    // Set up new real-time listener
    const healthRef = this.getHealthRecordsCollection(userId, cattleId)
    const unsubscribe = onSnapshot(healthRef, (snapshot) => {
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as HealthRecord))

      this.healthRecordsByAnimal.set(cattleId, records)
      this.notify() // Notify all subscribers that data changed
    }, (error) => {
      console.error(`Error in health records listener for cattle ${cattleId}:`, error)
    })

    this.unsubscribeHealthRecords.set(cattleId, unsubscribe)
    return unsubscribe
  }

  /**
   * Get health records for a cattle
   * Uses cached data if available via real-time listener, otherwise fetches and sets up listener
   */
  async getHealthRecords(cattleId: string): Promise<HealthRecord[]> {
    const userId = this.getUserId()
    if (!userId) return []

    // Return cached data if we have a real-time listener active
    const cached = this.healthRecordsByAnimal.get(cattleId)
    if (cached !== undefined) {
      return cached
    }

    // If not cached, fetch once and set up real-time listener for future updates
    try {
      const snapshot = await getDocs(this.getHealthRecordsCollection(userId, cattleId))
      const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HealthRecord))

      this.healthRecordsByAnimal.set(cattleId, records)

      // Set up listener for real-time updates
      this.subscribeToHealthRecords(cattleId)

      return records
    } catch (error) {
      console.error(`Error fetching health records for cattle ${cattleId}:`, error)
      return []
    }
  }

  // Batch fetch health records for multiple cattle - prevents N+1 query issues
  async getHealthRecordsByCattleIds(cattleIds: string[]): Promise<Map<string, HealthRecord[]>> {
    const userId = this.getUserId()
    if (!userId) return new Map()

    const recordsByAnimal = new Map<string, HealthRecord[]>()

    // Initialize map for all animals
    cattleIds.forEach(id => recordsByAnimal.set(id, []))

    try {
      // Fetch all health records in parallel
      const promises = cattleIds.map(cattleId =>
        getDocs(this.getHealthRecordsCollection(userId, cattleId))
          .then(snapshot => {
            const records = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as HealthRecord))
            recordsByAnimal.set(cattleId, records)
          })
          .catch(error => {
            console.error(`Error fetching health records for cattle ${cattleId}:`, error)
            recordsByAnimal.set(cattleId, [])
          })
      )

      await Promise.all(promises)
    } catch (error) {
      console.error("Error in batch health records fetch:", error)
    }

    return recordsByAnimal
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
      // Filter out undefined values for Firestore
      const recordData = Object.fromEntries(
        Object.entries(newRecord).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, recordData)
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

    // Get health record costs for all cattle using batch query (prevents N+1 query problem)
    let totalHealthCosts = 0
    try {
      const activeCattleIds = activeCattle.map(c => c.id)
      const healthRecordsByAnimal = await this.getHealthRecordsByCattleIds(activeCattleIds)

      // Calculate total health costs from batch-fetched records
      healthRecordsByAnimal.forEach((records) => {
        totalHealthCosts += records.reduce((sum, record) => sum + (record.cost || 0), 0)
      })
    } catch (error) {
      console.error("Error fetching health costs for analytics:", error)
      // Continue with totalHealthCosts = 0 if there's an error
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
