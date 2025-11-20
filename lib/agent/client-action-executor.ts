/**
 * Client-side Agent Action Executor
 * Executes structured actions using Firebase client SDK and existing stores
 */

import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { firebasePenStore } from "@/lib/pen-store-firebase"

export interface ActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export class ClientActionExecutor {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async addCattle(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      const cattle = await firebaseDataStore.addCattle({
        tagNumber: params.tagNumber,
        name: params.name || "",
        breed: params.breed || "Mixed",
        sex: params.sex || "Unknown",
        birthDate: params.birthDate || "",
        purchaseDate: params.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: params.purchasePrice || 0,
        purchaseWeight: params.purchaseWeight || params.weight || 0,
        weight: params.weight || 0,
        penId: params.penId || "",
        barnId: params.barnId || "",
        batchId: params.batchId || "",
        stage: params.stage || "",
        status: "Active",
        healthStatus: "Healthy",
        notes: params.notes || ""
      })

      return {
        success: true,
        message: `Successfully added cattle #${params.tagNumber}`,
        data: cattle
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add cattle",
        error: error.message
      }
    }
  }

  async updateCattle(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      // Find cattle by ID or tag number
      let cattleId = params.cattleId
      if (!cattleId && params.tagNumber) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattle = allCattle.find(c => c.tagNumber === params.tagNumber)
        if (!cattle) {
          return {
            success: false,
            message: `Cattle #${params.tagNumber} not found`
          }
        }
        cattleId = cattle.id
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle ID or tag number required"
        }
      }

      await firebaseDataStore.updateCattle(cattleId, params)

      return {
        success: true,
        message: `Successfully updated cattle`
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update cattle",
        error: error.message
      }
    }
  }

  async deleteCattle(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      let cattleId = params.cattleId
      if (!cattleId && params.tagNumber) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattle = allCattle.find(c => c.tagNumber === params.tagNumber)
        if (!cattle) {
          return {
            success: false,
            message: `Cattle #${params.tagNumber} not found`
          }
        }
        cattleId = cattle.id
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle ID or tag number required"
        }
      }

      await firebaseDataStore.deleteCattle(cattleId)

      return {
        success: true,
        message: "Successfully deleted cattle"
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to delete cattle",
        error: error.message
      }
    }
  }

  async getCattleInfo(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      if (params.penId) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattleInPen = allCattle.filter(c => c.penId === params.penId)
        return {
          success: true,
          message: `Found ${cattleInPen.length} cattle in pen`,
          data: cattleInPen
        }
      }

      if (params.tagNumber) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattle = allCattle.filter(c => c.tagNumber === params.tagNumber)
        return {
          success: true,
          message: cattle.length > 0 ? "Cattle found" : "No cattle found",
          data: cattle
        }
      }

      if (params.cattleId) {
        const cattle = await firebaseDataStore.getCattleById(params.cattleId)
        return {
          success: true,
          message: cattle ? "Cattle found" : "No cattle found",
          data: cattle ? [cattle] : []
        }
      }

      return {
        success: false,
        message: "Please specify cattleId, tagNumber, or penId"
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get cattle info",
        error: error.message
      }
    }
  }

  async getAllCattle(): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)
      const cattle = await firebaseDataStore.getCattle()

      // Group by pen
      const byPen: Record<string, number> = {}
      cattle.forEach(c => {
        const pen = c.penId || 'unassigned'
        byPen[pen] = (byPen[pen] || 0) + 1
      })

      return {
        success: true,
        message: `Found ${cattle.length} cattle`,
        data: {
          totalCount: cattle.length,
          cattle: cattle,
          penSummary: Object.entries(byPen).map(([penId, count]) => ({ penId, count }))
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get cattle",
        error: error.message
      }
    }
  }

  async addWeightRecord(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      let cattleId = params.cattleId
      if (!cattleId && params.tagNumber) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattle = allCattle.find(c => c.tagNumber === params.tagNumber)
        if (!cattle) {
          return {
            success: false,
            message: `Cattle #${params.tagNumber} not found`
          }
        }
        cattleId = cattle.id
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle ID or tag number required"
        }
      }

      await firebaseDataStore.addWeightRecord(
        cattleId,
        params.weight,
        params.date || new Date().toISOString(),
        params.notes || ""
      )

      return {
        success: true,
        message: `Successfully added weight record: ${params.weight} lbs`
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add weight record",
        error: error.message
      }
    }
  }

  async addHealthRecord(params: any): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)

      let cattleId = params.cattleId
      if (!cattleId && params.tagNumber) {
        const allCattle = await firebaseDataStore.getCattle()
        const cattle = allCattle.find(c => c.tagNumber === params.tagNumber)
        if (!cattle) {
          return {
            success: false,
            message: `Cattle #${params.tagNumber} not found`
          }
        }
        cattleId = cattle.id
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle ID or tag number required"
        }
      }

      await firebaseDataStore.addHealthRecord(
        cattleId,
        params.date || new Date().toISOString(),
        params.medicationName,
        params.quantity || 0,
        params.notes || ""
      )

      return {
        success: true,
        message: `Successfully added health record for ${params.medicationName}`
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add health record",
        error: error.message
      }
    }
  }

  async addPen(params: any): Promise<ActionResult> {
    try {
      await firebasePenStore.initialize(this.userId)

      const pen = await firebasePenStore.addPen({
        name: params.name,
        capacity: params.capacity || 50,
        currentCount: 0,
        notes: params.notes || "",
        barnId: params.barnId || ""
      })

      return {
        success: true,
        message: `Successfully added pen: ${params.name}`,
        data: pen
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add pen",
        error: error.message
      }
    }
  }

  async updatePen(params: any): Promise<ActionResult> {
    try {
      await firebasePenStore.initialize(this.userId)

      if (!params.penId) {
        return {
          success: false,
          message: "Pen ID required"
        }
      }

      await firebasePenStore.updatePen(params.penId, params)

      return {
        success: true,
        message: "Successfully updated pen"
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update pen",
        error: error.message
      }
    }
  }

  async deletePen(params: any): Promise<ActionResult> {
    try {
      await firebasePenStore.initialize(this.userId)

      if (!params.penId) {
        return {
          success: false,
          message: "Pen ID required"
        }
      }

      await firebasePenStore.deletePen(params.penId)

      return {
        success: true,
        message: "Successfully deleted pen"
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to delete pen",
        error: error.message
      }
    }
  }

  async getPenInfo(penId?: string): Promise<ActionResult> {
    try {
      await firebasePenStore.initialize(this.userId)

      const pens = await firebasePenStore.getPens()

      if (penId) {
        const pen = pens.find(p => p.id === penId)
        return {
          success: true,
          message: pen ? "Pen found" : "Pen not found",
          data: pen ? [pen] : []
        }
      }

      return {
        success: true,
        message: `Found ${pens.length} pens`,
        data: pens
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get pen info",
        error: error.message
      }
    }
  }

  async getCattleCountByPen(): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)
      await firebasePenStore.initialize(this.userId)

      const cattle = await firebaseDataStore.getCattle()
      const pens = await firebasePenStore.getPens()

      const penCounts = pens.map(pen => ({
        id: pen.id,
        name: pen.name,
        count: cattle.filter(c => c.penId === pen.id).length,
        capacity: pen.capacity
      }))

      return {
        success: true,
        message: `Counted cattle across ${pens.length} pens`,
        data: penCounts
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to count cattle by pen",
        error: error.message
      }
    }
  }

  async addBarn(params: any): Promise<ActionResult> {
    try {
      const barnRef = collection(db, `users/${this.userId}/barns`)
      const barn = await addDoc(barnRef, {
        name: params.name,
        location: params.location || "Main Area",
        notes: params.notes || "",
        createdAt: Timestamp.now()
      })

      return {
        success: true,
        message: `Successfully added barn: ${params.name}`,
        data: { id: barn.id, ...params }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add barn",
        error: error.message
      }
    }
  }

  async deleteBarn(params: any): Promise<ActionResult> {
    try {
      if (!params.barnId) {
        return {
          success: false,
          message: "Barn ID required"
        }
      }

      const barnDoc = doc(db, `users/${this.userId}/barns`, params.barnId)
      await deleteDoc(barnDoc)

      return {
        success: true,
        message: "Successfully deleted barn"
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to delete barn",
        error: error.message
      }
    }
  }

  async addMedication(params: any): Promise<ActionResult> {
    try {
      const inventoryRef = collection(db, `users/${this.userId}/inventory`)
      const medication = await addDoc(inventoryRef, {
        name: params.name,
        category: params.category || "medication",
        quantityOnHand: params.quantity || 1,
        unit: params.unit || "ml",
        reorderPoint: params.reorderPoint || 5,
        costPerUnit: params.costPerUnit || 0,
        withdrawalPeriod: params.withdrawalPeriod || 0,
        storageLocation: params.storageLocation || "",
        notes: params.notes || "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      return {
        success: true,
        message: `Successfully added medication: ${params.name}`,
        data: { id: medication.id, ...params }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to add medication",
        error: error.message
      }
    }
  }

  async getInventoryInfo(itemName?: string): Promise<ActionResult> {
    try {
      const inventoryRef = collection(db, `users/${this.userId}/inventory`)
      let q = query(inventoryRef)

      if (itemName) {
        // Case-insensitive search
        const snapshot = await getDocs(q)
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) =>
            item.name.toLowerCase().includes(itemName.toLowerCase())
          )

        return {
          success: true,
          message: `Found ${items.length} inventory items`,
          data: items
        }
      }

      const snapshot = await getDocs(q)
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      return {
        success: true,
        message: `Found ${items.length} inventory items`,
        data: items
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get inventory info",
        error: error.message
      }
    }
  }

  async logActivity(params: any): Promise<ActionResult> {
    try {
      const activityRef = collection(db, `users/${this.userId}/penActivities`)
      const activity = await addDoc(activityRef, {
        penId: params.penId,
        activityType: params.activityType,
        description: params.description,
        date: params.date || new Date().toISOString(),
        performedBy: params.performedBy || "Farm Assistant",
        notes: params.notes || "",
        createdAt: Timestamp.now()
      })

      return {
        success: true,
        message: `Successfully logged activity: ${params.activityType}`,
        data: { id: activity.id, ...params }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to log activity",
        error: error.message
      }
    }
  }

  async getFarmSummary(): Promise<ActionResult> {
    try {
      await firebaseDataStore.initialize(this.userId)
      await firebasePenStore.initialize(this.userId)

      const cattle = await firebaseDataStore.getCattle()
      const pens = await firebasePenStore.getPens()

      const inventoryRef = collection(db, `users/${this.userId}/inventory`)
      const inventorySnapshot = await getDocs(inventoryRef)
      const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      const totalValue = inventory.reduce((sum, item: any) =>
        sum + ((item.quantityOnHand || 0) * (item.costPerUnit || 0)), 0
      )

      const lowStockItems = inventory.filter((item: any) =>
        item.reorderPoint && item.quantityOnHand <= item.reorderPoint
      )

      return {
        success: true,
        message: "Farm summary generated",
        data: {
          cattle: {
            total: cattle.length
          },
          pens: {
            total: pens.length,
            penList: pens
          },
          inventory: {
            total: inventory.length,
            totalValue: totalValue,
            lowStockCount: lowStockItems.length,
            lowStockItems: lowStockItems
          }
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get farm summary",
        error: error.message
      }
    }
  }
}
