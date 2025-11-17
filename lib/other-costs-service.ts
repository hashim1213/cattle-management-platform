/**
 * Other Costs Service
 * Manage labour, utilities, equipment, and other operating costs
 */

import { db, storage } from "@/lib/firebase"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

export interface OtherCost {
  id: string
  userId: string
  date: string
  category: "labour" | "utilities" | "equipment" | "maintenance" | "transportation" | "insurance" | "taxes" | "veterinary" | "other"
  description: string
  amount: number
  payee?: string
  notes?: string
  invoiceUrl?: string
  invoiceFileName?: string
  createdAt: string
  updatedAt: string
}

export interface OtherCostInput {
  date: string
  category: OtherCost["category"]
  description: string
  amount: number
  payee?: string
  notes?: string
}

class OtherCostsService {
  private getCollectionRef(userId: string) {
    return collection(db, "users", userId, "otherCosts")
  }

  // Add a new cost record
  async addCost(userId: string, input: OtherCostInput, invoiceFile?: File): Promise<string> {
    const id = doc(collection(db, "temp")).id
    const now = new Date().toISOString()

    let invoiceUrl: string | undefined
    let invoiceFileName: string | undefined

    // Upload invoice if provided
    if (invoiceFile) {
      const fileExt = invoiceFile.name.split('.').pop()
      const fileName = `${id}.${fileExt}`
      const storageRef = ref(storage, `users/${userId}/invoices/${fileName}`)

      await uploadBytes(storageRef, invoiceFile)
      invoiceUrl = await getDownloadURL(storageRef)
      invoiceFileName = invoiceFile.name
    }

    const cost: OtherCost = {
      id,
      userId,
      ...input,
      invoiceUrl,
      invoiceFileName,
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(doc(this.getCollectionRef(userId), id), cost)
    return id
  }

  // Update a cost record
  async updateCost(userId: string, id: string, updates: Partial<OtherCostInput>): Promise<void> {
    const costRef = doc(this.getCollectionRef(userId), id)
    await setDoc(costRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  }

  // Upload or replace invoice for a cost record
  async uploadInvoice(userId: string, costId: string, invoiceFile: File): Promise<string> {
    const cost = await this.getCost(userId, costId)

    // Delete old invoice if exists
    if (cost?.invoiceUrl) {
      try {
        const oldRef = ref(storage, cost.invoiceUrl)
        await deleteObject(oldRef)
      } catch (error) {
        console.warn("Failed to delete old invoice:", error)
      }
    }

    // Upload new invoice
    const fileExt = invoiceFile.name.split('.').pop()
    const fileName = `${costId}.${fileExt}`
    const storageRef = ref(storage, `users/${userId}/invoices/${fileName}`)

    await uploadBytes(storageRef, invoiceFile)
    const invoiceUrl = await getDownloadURL(storageRef)

    // Update cost record with invoice URL
    await this.updateCost(userId, costId, {})
    const costRef = doc(this.getCollectionRef(userId), costId)
    await setDoc(costRef, {
      invoiceUrl,
      invoiceFileName: invoiceFile.name,
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    return invoiceUrl
  }

  // Delete a cost record (and its invoice if exists)
  async deleteCost(userId: string, id: string): Promise<void> {
    const cost = await this.getCost(userId, id)

    // Delete invoice if exists
    if (cost?.invoiceUrl) {
      try {
        const storageRef = ref(storage, cost.invoiceUrl)
        await deleteObject(storageRef)
      } catch (error) {
        console.warn("Failed to delete invoice:", error)
      }
    }

    await deleteDoc(doc(this.getCollectionRef(userId), id))
  }

  // Get a single cost record
  async getCost(userId: string, id: string): Promise<OtherCost | null> {
    const docSnap = await getDoc(doc(this.getCollectionRef(userId), id))
    return docSnap.exists() ? (docSnap.data() as OtherCost) : null
  }

  // Get all cost records for a user
  async getAllCosts(userId: string): Promise<OtherCost[]> {
    const q = query(this.getCollectionRef(userId), orderBy("date", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as OtherCost)
  }

  // Get costs by category
  async getCostsByCategory(userId: string, category: OtherCost["category"]): Promise<OtherCost[]> {
    const q = query(
      this.getCollectionRef(userId),
      where("category", "==", category),
      orderBy("date", "desc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as OtherCost)
  }

  // Get costs within a date range
  async getCostsByDateRange(userId: string, startDate: string, endDate: string): Promise<OtherCost[]> {
    const q = query(
      this.getCollectionRef(userId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as OtherCost)
  }

  // Calculate total costs by category
  calculateTotalByCategory(costs: OtherCost[]): Record<string, number> {
    const totals: Record<string, number> = {}

    costs.forEach(cost => {
      if (!totals[cost.category]) {
        totals[cost.category] = 0
      }
      totals[cost.category] += cost.amount
    })

    return totals
  }

  // Calculate total costs
  calculateTotal(costs: OtherCost[]): number {
    return costs.reduce((sum, cost) => sum + cost.amount, 0)
  }
}

export const otherCostsService = new OtherCostsService()
