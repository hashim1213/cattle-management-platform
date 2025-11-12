/**
 * Pen Activity Store - Firebase Edition
 * Manages pen-level activities like feeding and medication
 * Automatically calculates per-cattle averages
 */

import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export interface PenFeedActivity {
  id: string
  penId: string
  barnId: string
  date: string
  feedType: string
  totalAmount: number // Total amount fed to pen
  unit: string // lbs, kg, bales, etc.
  costPerUnit: number
  totalCost: number
  cattleCount: number // Number of cattle in pen at time of feeding
  averagePerCattle: number // Automatically calculated
  notes?: string
  createdAt: string
  createdBy: string
}

export interface PenMedicationActivity {
  id: string
  penId: string
  barnId: string
  date: string
  medicationName: string
  purpose: string // Treatment, Prevention, etc.
  dosagePerHead: number
  unit: string
  cattleCount: number
  totalDosage: number // Automatically calculated
  costPerHead: number
  totalCost: number
  withdrawalPeriod?: number // Days
  notes?: string
  createdAt: string
  createdBy: string
}

class PenActivityStore {
  private feedActivities: PenFeedActivity[] = []
  private medicationActivities: PenMedicationActivity[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    // Data will be loaded when user logs in
  }

  private getUserId(): string | null {
    return auth.currentUser?.uid || null
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // FEED ACTIVITIES
  async loadFeedActivities() {
    const userId = this.getUserId()
    if (!userId) return

    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/penFeedActivities`))
      this.feedActivities = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PenFeedActivity))
      this.notifyListeners()
    } catch (error) {
      console.error("Error loading feed activities:", error)
      this.feedActivities = []
    }
  }

  async addFeedActivity(
    activity: Omit<PenFeedActivity, "id" | "createdAt" | "createdBy" | "averagePerCattle" | "totalCost">
  ): Promise<PenFeedActivity> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const id = `feed_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newActivity: PenFeedActivity = {
      ...activity,
      id,
      averagePerCattle: activity.totalAmount / activity.cattleCount,
      totalCost: activity.totalAmount * activity.costPerUnit,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    }

    try {
      const docRef = doc(db, `users/${userId}/penFeedActivities`, id)
      const activityData = Object.fromEntries(
        Object.entries(newActivity).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, activityData)

      this.feedActivities.push(newActivity)
      this.notifyListeners()
      return newActivity
    } catch (error: any) {
      console.error("Firebase addFeedActivity error:", error)
      throw new Error(error?.message || "Failed to add feed activity")
    }
  }

  async deleteFeedActivity(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      await deleteDoc(doc(db, `users/${userId}/penFeedActivities`, id))
      this.feedActivities = this.feedActivities.filter((a) => a.id !== id)
      this.notifyListeners()
    } catch (error) {
      throw new Error("Failed to delete feed activity")
    }
  }

  getAllFeedActivities(): PenFeedActivity[] {
    return [...this.feedActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getFeedActivitiesByPen(penId: string): PenFeedActivity[] {
    return this.feedActivities
      .filter((a) => a.penId === penId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getTotalFeedCostByPen(penId: string, startDate?: string, endDate?: string): number {
    let activities = this.feedActivities.filter((a) => a.penId === penId)

    if (startDate) {
      activities = activities.filter((a) => a.date >= startDate)
    }
    if (endDate) {
      activities = activities.filter((a) => a.date <= endDate)
    }

    return activities.reduce((sum, a) => sum + a.totalCost, 0)
  }

  // MEDICATION ACTIVITIES
  async loadMedicationActivities() {
    const userId = this.getUserId()
    if (!userId) return

    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/penMedicationActivities`))
      this.medicationActivities = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PenMedicationActivity))
      this.notifyListeners()
    } catch (error) {
      console.error("Error loading medication activities:", error)
      this.medicationActivities = []
    }
  }

  async addMedicationActivity(
    activity: Omit<PenMedicationActivity, "id" | "createdAt" | "createdBy" | "totalDosage" | "totalCost">
  ): Promise<PenMedicationActivity> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    const id = `med_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newActivity: PenMedicationActivity = {
      ...activity,
      id,
      totalDosage: activity.dosagePerHead * activity.cattleCount,
      totalCost: activity.costPerHead * activity.cattleCount,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    }

    try {
      const docRef = doc(db, `users/${userId}/penMedicationActivities`, id)
      const activityData = Object.fromEntries(
        Object.entries(newActivity).filter(([_, v]) => v !== undefined)
      )
      await setDoc(docRef, activityData)

      this.medicationActivities.push(newActivity)
      this.notifyListeners()
      return newActivity
    } catch (error: any) {
      console.error("Firebase addMedicationActivity error:", error)
      throw new Error(error?.message || "Failed to add medication activity")
    }
  }

  async deleteMedicationActivity(id: string): Promise<void> {
    const userId = this.getUserId()
    if (!userId) throw new Error("Not authenticated")

    try {
      await deleteDoc(doc(db, `users/${userId}/penMedicationActivities`, id))
      this.medicationActivities = this.medicationActivities.filter((a) => a.id !== id)
      this.notifyListeners()
    } catch (error) {
      throw new Error("Failed to delete medication activity")
    }
  }

  getAllMedicationActivities(): PenMedicationActivity[] {
    return [...this.medicationActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getMedicationActivitiesByPen(penId: string): PenMedicationActivity[] {
    return this.medicationActivities
      .filter((a) => a.penId === penId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getTotalMedicationCostByPen(penId: string, startDate?: string, endDate?: string): number {
    let activities = this.medicationActivities.filter((a) => a.penId === penId)

    if (startDate) {
      activities = activities.filter((a) => a.date >= startDate)
    }
    if (endDate) {
      activities = activities.filter((a) => a.date <= endDate)
    }

    return activities.reduce((sum, a) => sum + a.totalCost, 0)
  }

  // PEN ROI CALCULATIONS
  getPenROI(
    penId: string,
    totalRevenue: number,
    startDate?: string,
    endDate?: string
  ): {
    totalFeedCost: number
    totalMedicationCost: number
    totalCosts: number
    revenue: number
    profit: number
    roi: number // Percentage
  } {
    const feedCost = this.getTotalFeedCostByPen(penId, startDate, endDate)
    const medicationCost = this.getTotalMedicationCostByPen(penId, startDate, endDate)
    const totalCosts = feedCost + medicationCost
    const profit = totalRevenue - totalCosts
    const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0

    return {
      totalFeedCost: feedCost,
      totalMedicationCost: medicationCost,
      totalCosts,
      revenue: totalRevenue,
      profit,
      roi,
    }
  }
}

export const penActivityStore = new PenActivityStore()
