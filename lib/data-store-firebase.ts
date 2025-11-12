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
  dam?: string
  sire?: string
  lot: string
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
  brandNumber?: string
  arrivalDate?: string
  arrivalWeight?: number
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

  // CATTLE OPERATIONS
  async getCattle(): Promise<Cattle[]> {
    const userId = this.getUserId()
    if (!userId) return []

    try {
      const snapshot = await getDocs(this.getCattleCollection(userId))
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cattle))
    } catch (error) {
      return []
    }
  }

  async getCattleById(id: string): Promise<Cattle | null> {
    const userId = this.getUserId()
    if (!userId) return null

    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Cattle
      }
      return null
    } catch (error) {
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
      await setDoc(docRef, newCattle)
      return newCattle
    } catch (error) {
      throw new Error("Failed to add cattle")
    }
  }

  async updateCattle(id: string, updates: Partial<Cattle>): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      const docRef = doc(db, `users/${userId}/cattle`, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      throw new Error("Failed to update cattle")
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
  async getAnalytics() {
    const cattle = await this.getCattle()
    const activeCattle = cattle.filter((c) => c.status === "Active")

    const totalCattle = cattle.length
    const activeCattleCount = activeCattle.length
    const healthyCount = cattle.filter((c) => c.healthStatus === "Healthy").length
    const sickCount = cattle.filter((c) => c.healthStatus === "Sick" || c.healthStatus === "Treatment").length

    // Calculate average weight
    const avgWeight = activeCattleCount > 0
      ? Math.round(activeCattle.reduce((sum, c) => sum + (c.weight || 0), 0) / activeCattleCount)
      : 0

    // Calculate average daily gain
    const cattleWithGain = activeCattle.filter(c => (c.weight || 0) > 0 && (c.arrivalWeight || 0) > 0 && (c.daysOnFeed || 0) > 0)
    const avgDailyGain = cattleWithGain.length > 0
      ? cattleWithGain.reduce((sum, c) => {
          const gain = ((c.weight || 0) - (c.arrivalWeight || 0)) / (c.daysOnFeed || 1)
          return sum + gain
        }, 0) / cattleWithGain.length
      : 0

    // Calculate total value (estimated market value)
    const marketPricePerPound = 1.65 // Default market price
    const totalValue = activeCattle.reduce((sum, c) => {
      return sum + ((c.weight || 0) * marketPricePerPound)
    }, 0)

    // Calculate total inventory value (purchase price + costs)
    const totalInventoryValue = activeCattle.reduce((sum, c) => {
      return sum + (c.purchasePrice || 0)
    }, 0)

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
