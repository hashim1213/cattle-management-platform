/**
 * Agent Action Executor
 * Executes structured actions parsed from chat/voice commands
 */

import { db, auth } from "@/lib/firebase"
import { collection, doc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore"
import type { InventoryItem, InventoryTransaction } from "@/lib/inventory/inventory-types"
import type { Cattle } from "@/lib/data-store-firebase"
import type { Pen } from "@/lib/pen-store-firebase"

export interface ActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export interface AddMedicationParams {
  name: string
  category: string
  quantity: number
  unit: string
  costPerUnit?: number
  withdrawalPeriod?: number
  storageLocation?: string
  notes?: string
}

export interface UpdatePenParams {
  penId: string
  name?: string
  capacity?: number
  notes?: string
}

export interface LogActivityParams {
  penId: string
  activityType: string
  description: string
  date?: string
  performedBy?: string
  notes?: string
}

export interface AddHealthRecordParams {
  cattleId?: string
  penId?: string
  tagNumber?: string
  medicationName: string
  quantity: number
  date?: string
  notes?: string
}

class AgentActionExecutor {
  /**
   * Add medication to inventory
   */
  async addMedication(userId: string, params: AddMedicationParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const id = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      const inventoryItem: InventoryItem = {
        id,
        name: params.name,
        category: params.category as any,
        quantityOnHand: params.quantity,
        unit: params.unit as any,
        reorderPoint: 0,
        reorderQuantity: 0,
        lowStockAlertSent: false,
        costPerUnit: params.costPerUnit || 0,
        totalValue: (params.costPerUnit || 0) * params.quantity,
        withdrawalPeriod: params.withdrawalPeriod,
        storageLocation: params.storageLocation || "Main Storage",
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      }

      const docRef = doc(db, `users/${userId}/inventory`, id)
      await setDoc(docRef, inventoryItem)

      // Create transaction log
      const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const transaction: InventoryTransaction = {
        id: transactionId,
        itemId: id,
        itemName: params.name,
        type: "purchase",
        quantityBefore: 0,
        quantityChange: params.quantity,
        quantityAfter: params.quantity,
        unit: params.unit as any,
        costPerUnit: params.costPerUnit || 0,
        costImpact: (params.costPerUnit || 0) * params.quantity,
        reason: "Added via Farm Assistant",
        performedBy: userId,
        timestamp: now
      }

      const transRef = doc(db, `users/${userId}/inventoryTransactions`, transactionId)
      await setDoc(transRef, transaction)

      return {
        success: true,
        message: `Successfully added ${params.quantity} ${params.unit} of ${params.name} to inventory`,
        data: inventoryItem
      }
    } catch (error: any) {
      console.error("Error adding medication:", error)
      return {
        success: false,
        message: "Failed to add medication",
        error: error.message
      }
    }
  }

  /**
   * Update pen information
   */
  async updatePen(userId: string, params: UpdatePenParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const penRef = doc(db, `users/${userId}/pens`, params.penId)
      const updates: any = {
        updatedAt: new Date().toISOString()
      }

      if (params.name) updates.name = params.name
      if (params.capacity !== undefined) updates.capacity = params.capacity
      if (params.notes !== undefined) updates.notes = params.notes

      await updateDoc(penRef, updates)

      return {
        success: true,
        message: `Successfully updated pen information`,
        data: updates
      }
    } catch (error: any) {
      console.error("Error updating pen:", error)
      return {
        success: false,
        message: "Failed to update pen",
        error: error.message
      }
    }
  }

  /**
   * Log activity for a pen
   */
  async logActivity(userId: string, params: LogActivityParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const id = `activity_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      const activity = {
        id,
        penId: params.penId,
        activityType: params.activityType,
        description: params.description,
        date: params.date || now,
        performedBy: params.performedBy || userId,
        notes: params.notes,
        createdAt: now
      }

      const docRef = doc(db, `users/${userId}/penActivities`, id)
      await setDoc(docRef, activity)

      return {
        success: true,
        message: `Successfully logged activity for pen`,
        data: activity
      }
    } catch (error: any) {
      console.error("Error logging activity:", error)
      return {
        success: false,
        message: "Failed to log activity",
        error: error.message
      }
    }
  }

  /**
   * Add health record and deduct inventory
   */
  async addHealthRecord(userId: string, params: AddHealthRecordParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleIds: string[] = []

      // Find cattle by tag number, ID, or pen
      if (params.cattleId) {
        cattleIds = [params.cattleId]
      } else if (params.tagNumber) {
        const cattleQuery = query(
          collection(db, `users/${userId}/cattle`),
          where("tagNumber", "==", params.tagNumber)
        )
        const snapshot = await getDocs(cattleQuery)
        cattleIds = snapshot.docs.map(doc => doc.id)
      } else if (params.penId) {
        const cattleQuery = query(
          collection(db, `users/${userId}/cattle`),
          where("penId", "==", params.penId)
        )
        const snapshot = await getDocs(cattleQuery)
        cattleIds = snapshot.docs.map(doc => doc.id)
      }

      if (cattleIds.length === 0) {
        return {
          success: false,
          message: "No cattle found matching criteria",
          error: "NO_CATTLE_FOUND"
        }
      }

      // Find medication in inventory
      const inventoryQuery = query(
        collection(db, `users/${userId}/inventory`),
        where("name", "==", params.medicationName)
      )
      const invSnapshot = await getDocs(inventoryQuery)

      if (invSnapshot.empty) {
        return {
          success: false,
          message: `Medication "${params.medicationName}" not found in inventory`,
          error: "MEDICATION_NOT_FOUND"
        }
      }

      const medication = { id: invSnapshot.docs[0].id, ...invSnapshot.docs[0].data() } as InventoryItem
      const totalQuantityNeeded = params.quantity * cattleIds.length

      if (medication.quantityOnHand < totalQuantityNeeded) {
        return {
          success: false,
          message: `Insufficient inventory. Need ${totalQuantityNeeded} ${medication.unit}, only ${medication.quantityOnHand} available`,
          error: "INSUFFICIENT_INVENTORY"
        }
      }

      // Create health records for each cattle
      const now = new Date().toISOString()
      const healthRecords = []

      for (const cattleId of cattleIds) {
        const recordId = `health_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const healthRecord = {
          id: recordId,
          cattleId,
          date: params.date || now,
          type: "Treatment",
          description: `Administered ${params.quantity} ${medication.unit} of ${params.medicationName}`,
          notes: params.notes,
          createdAt: now
        }

        const docRef = doc(db, `users/${userId}/cattle/${cattleId}/healthRecords`, recordId)
        await setDoc(docRef, healthRecord)
        healthRecords.push(healthRecord)
      }

      // Deduct from inventory
      const newQuantity = medication.quantityOnHand - totalQuantityNeeded
      const medRef = doc(db, `users/${userId}/inventory`, medication.id)
      await updateDoc(medRef, {
        quantityOnHand: newQuantity,
        totalValue: newQuantity * medication.costPerUnit,
        updatedAt: now
      })

      // Create transaction log
      const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const transaction: InventoryTransaction = {
        id: transactionId,
        itemId: medication.id,
        itemName: medication.name,
        type: "usage",
        quantityBefore: medication.quantityOnHand,
        quantityChange: -totalQuantityNeeded,
        quantityAfter: newQuantity,
        unit: medication.unit,
        costPerUnit: medication.costPerUnit,
        costImpact: -totalQuantityNeeded * medication.costPerUnit,
        reason: `Health treatment for ${cattleIds.length} cattle`,
        performedBy: userId,
        timestamp: now
      }

      const transRef = doc(db, `users/${userId}/inventoryTransactions`, transactionId)
      await setDoc(transRef, transaction)

      return {
        success: true,
        message: `Successfully treated ${cattleIds.length} cattle with ${params.medicationName}. Deducted ${totalQuantityNeeded} ${medication.unit} from inventory (${newQuantity} remaining)`,
        data: {
          healthRecords,
          inventoryUpdate: {
            itemName: medication.name,
            quantityDeducted: totalQuantityNeeded,
            quantityRemaining: newQuantity,
            unit: medication.unit
          }
        }
      }
    } catch (error: any) {
      console.error("Error adding health record:", error)
      return {
        success: false,
        message: "Failed to add health record",
        error: error.message
      }
    }
  }

  /**
   * Get cattle information
   */
  async getCattleInfo(userId: string, searchParams: { tagNumber?: string; penId?: string; cattleId?: string }): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleQuery

      if (searchParams.cattleId) {
        const docRef = doc(db, `users/${userId}/cattle`, searchParams.cattleId)
        const snapshot = await getDocs(collection(db, `users/${userId}/cattle`))
        const cattle = snapshot.docs.find(doc => doc.id === searchParams.cattleId)
        return {
          success: true,
          message: "Cattle information retrieved",
          data: cattle ? { id: cattle.id, ...cattle.data() } : null
        }
      } else if (searchParams.tagNumber) {
        cattleQuery = query(
          collection(db, `users/${userId}/cattle`),
          where("tagNumber", "==", searchParams.tagNumber)
        )
      } else if (searchParams.penId) {
        cattleQuery = query(
          collection(db, `users/${userId}/cattle`),
          where("penId", "==", searchParams.penId)
        )
      } else {
        return {
          success: false,
          message: "Please provide tagNumber, penId, or cattleId",
          error: "INVALID_QUERY"
        }
      }

      const snapshot = await getDocs(cattleQuery)
      const cattle = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      return {
        success: true,
        message: `Found ${cattle.length} cattle`,
        data: cattle
      }
    } catch (error: any) {
      console.error("Error getting cattle info:", error)
      return {
        success: false,
        message: "Failed to get cattle information",
        error: error.message
      }
    }
  }

  /**
   * Get pen information
   */
  async getPenInfo(userId: string, penId?: string): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      if (penId) {
        const docRef = doc(db, `users/${userId}/pens`, penId)
        const snapshot = await getDocs(collection(db, `users/${userId}/pens`))
        const pen = snapshot.docs.find(doc => doc.id === penId)
        return {
          success: true,
          message: "Pen information retrieved",
          data: pen ? { id: pen.id, ...pen.data() } : null
        }
      } else {
        const snapshot = await getDocs(collection(db, `users/${userId}/pens`))
        const pens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return {
          success: true,
          message: `Found ${pens.length} pens`,
          data: pens
        }
      }
    } catch (error: any) {
      console.error("Error getting pen info:", error)
      return {
        success: false,
        message: "Failed to get pen information",
        error: error.message
      }
    }
  }

  /**
   * Get inventory information
   */
  async getInventoryInfo(userId: string, itemName?: string): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      if (itemName) {
        const inventoryQuery = query(
          collection(db, `users/${userId}/inventory`),
          where("name", "==", itemName)
        )
        const snapshot = await getDocs(inventoryQuery)
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return {
          success: true,
          message: items.length > 0 ? "Item found" : "Item not found",
          data: items
        }
      } else {
        const snapshot = await getDocs(collection(db, `users/${userId}/inventory`))
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return {
          success: true,
          message: `Found ${items.length} inventory items`,
          data: items
        }
      }
    } catch (error: any) {
      console.error("Error getting inventory info:", error)
      return {
        success: false,
        message: "Failed to get inventory information",
        error: error.message
      }
    }
  }
}

export const actionExecutor = new AgentActionExecutor()
