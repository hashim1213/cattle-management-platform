/**
 * Agent Action Executor
 * Executes structured actions parsed from chat/voice commands
 */

import { adminDb } from "@/lib/firebase-admin"

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

export interface AddCattleParams {
  tagNumber: string
  name?: string
  breed: string
  sex: "Bull" | "Cow" | "Steer" | "Heifer" | "Unknown"
  birthDate?: string
  purchaseDate?: string
  purchasePrice?: number
  purchaseWeight?: number
  weight: number
  penId?: string
  barnId?: string
  batchId?: string
  stage?: string
  notes?: string
}

export interface UpdateCattleParams {
  cattleId?: string
  tagNumber?: string
  weight?: number
  penId?: string
  barnId?: string
  status?: "Active" | "Sold" | "Deceased" | "Culled"
  healthStatus?: "Healthy" | "Sick" | "Treatment" | "Quarantine"
  notes?: string
}

export interface DeleteCattleParams {
  cattleId?: string
  tagNumber?: string
}

export interface AddWeightRecordParams {
  cattleId?: string
  tagNumber?: string
  weight: number
  date?: string
  notes?: string
}

export interface AddBarnParams {
  name: string
  location: string
  notes?: string
}

export interface AddPenParams {
  name: string
  barnId: string
  capacity: number
  notes?: string
}

export interface DeletePenParams {
  penId: string
}

export interface DeleteBarnParams {
  barnId: string
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

    // Require at minimum a name
    if (!params.name) {
      return {
        success: false,
        message: "Please provide a medication name",
        error: "MISSING_NAME"
      }
    }

    try {
      const id = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      // Use smart defaults for missing fields
      const category = params.category || "antibiotic"
      const quantity = params.quantity !== undefined && params.quantity !== null ? params.quantity : 1
      const unit = params.unit || "ml"

      const inventoryItem: InventoryItem = {
        id,
        name: params.name,
        category: category as any,
        quantityOnHand: quantity,
        unit: unit as any,
        reorderPoint: 0,
        reorderQuantity: 0,
        lowStockAlertSent: false,
        costPerUnit: params.costPerUnit || 0,
        totalValue: (params.costPerUnit || 0) * quantity,
        withdrawalPeriod: params.withdrawalPeriod,
        storageLocation: params.storageLocation || "Main Storage",
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      }

      const docRef = adminDb.collection(`users/${userId}/inventory`).doc(id)
      await docRef.set(inventoryItem)

      // Create transaction log
      const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const transaction: InventoryTransaction = {
        id: transactionId,
        itemId: id,
        itemName: params.name,
        type: "purchase",
        quantityBefore: 0,
        quantityChange: quantity,
        quantityAfter: quantity,
        unit: unit as any,
        costPerUnit: params.costPerUnit || 0,
        costImpact: (params.costPerUnit || 0) * quantity,
        reason: "Added via Farm Assistant",
        performedBy: userId,
        timestamp: now
      }

      const transRef = adminDb.collection(`users/${userId}/inventoryTransactions`).doc(transactionId)
      await transRef.set(transaction)

      return {
        success: true,
        message: `Successfully added ${quantity} ${unit} of ${params.name} to inventory`,
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
      const penRef = adminDb.collection(`users/${userId}/pens`).doc(params.penId)
      const updates: any = {
        updatedAt: new Date().toISOString()
      }

      if (params.name) updates.name = params.name
      if (params.capacity !== undefined) updates.capacity = params.capacity
      if (params.notes !== undefined) updates.notes = params.notes

      await penRef.update(updates)

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

      const docRef = adminDb.collection(`users/${userId}/penActivities`).doc(id)
      await docRef.set(activity)

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
        const cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("tagNumber", "==", params.tagNumber)
        const snapshot = await cattleQuery.get()
        cattleIds = snapshot.docs.map(doc => doc.id)
      } else if (params.penId) {
        const cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("penId", "==", params.penId)
        const snapshot = await cattleQuery.get()
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
      const inventoryQuery = adminDb.collection(`users/${userId}/inventory`).where("name", "==", params.medicationName)
      const invSnapshot = await inventoryQuery.get()

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

        const docRef = adminDb.collection(`users/${userId}/cattle/${cattleId}/healthRecords`).doc(recordId)
        await docRef.set(healthRecord)
        healthRecords.push(healthRecord)
      }

      // Deduct from inventory
      const newQuantity = medication.quantityOnHand - totalQuantityNeeded
      const medRef = adminDb.collection(`users/${userId}/inventory`).doc(medication.id)
      await medRef.update({
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

      const transRef = adminDb.collection(`users/${userId}/inventoryTransactions`).doc(transactionId)
      await transRef.set(transaction)

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
    console.log('[getCattleInfo] Called with userId:', userId, 'searchParams:', searchParams)

    if (!userId) {
      console.error('[getCattleInfo] No userId provided')
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleQuery

      if (searchParams.cattleId) {
        console.log('[getCattleInfo] Fetching by cattleId:', searchParams.cattleId)
        const docRef = adminDb.collection(`users/${userId}/cattle`).doc(searchParams.cattleId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
          console.log('[getCattleInfo] Cattle not found:', searchParams.cattleId)
          return {
            success: false,
            message: `Cattle with ID ${searchParams.cattleId} not found`,
            error: "CATTLE_NOT_FOUND"
          }
        }

        const cattleData = { id: docSnap.id, ...docSnap.data() }
        console.log('[getCattleInfo] Successfully retrieved cattle:', cattleData)
        return {
          success: true,
          message: "Cattle information retrieved",
          data: [cattleData]
        }
      } else if (searchParams.tagNumber) {
        console.log('[getCattleInfo] Fetching by tagNumber:', searchParams.tagNumber)
        cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("tagNumber", "==", searchParams.tagNumber)
      } else if (searchParams.penId) {
        console.log('[getCattleInfo] Fetching by penId:', searchParams.penId)
        cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("penId", "==", searchParams.penId)
      } else {
        console.log('[getCattleInfo] No valid search parameter provided')
        return {
          success: false,
          message: "Please provide tagNumber, penId, or cattleId",
          error: "INVALID_QUERY"
        }
      }

      const snapshot = await cattleQuery.get()
      const cattle = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      console.log(`[getCattleInfo] Successfully retrieved ${cattle.length} cattle`)
      return {
        success: true,
        message: `Found ${cattle.length} cattle`,
        data: cattle
      }
    } catch (error: any) {
      console.error('[getCattleInfo] Error occurred:', {
        error: error,
        message: error.message,
        code: error.code,
        userId: userId,
        searchParams: searchParams,
        stack: error.stack
      })

      let errorMessage = "Failed to get cattle information"
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your Firestore security rules."
      } else if (error.code === 'unavailable') {
        errorMessage = "Database temporarily unavailable. Please try again."
      } else if (error.message) {
        errorMessage = `Failed to get cattle information: ${error.message}`
      }

      return {
        success: false,
        message: errorMessage,
        error: error.code || error.message
      }
    }
  }

  /**
   * Get pen information
   */
  async getPenInfo(userId: string, penId?: string): Promise<ActionResult> {
    console.log('[getPenInfo] Called with userId:', userId, 'penId:', penId)

    if (!userId) {
      console.error('[getPenInfo] No userId provided')
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      if (penId) {
        console.log('[getPenInfo] Fetching specific pen:', penId)
        const docRef = adminDb.collection(`users/${userId}/pens`).doc(penId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
          console.log('[getPenInfo] Pen not found:', penId)
          return {
            success: false,
            message: `Pen with ID ${penId} not found`,
            error: "PEN_NOT_FOUND"
          }
        }

        const penData = { id: docSnap.id, ...docSnap.data() }
        console.log('[getPenInfo] Successfully retrieved pen:', penData)
        return {
          success: true,
          message: "Pen information retrieved",
          data: [penData] // Return as array for consistency with formatQueryResponse
        }
      } else {
        console.log('[getPenInfo] Fetching all pens for user:', userId)
        const collectionRef = adminDb.collection(`users/${userId}/pens`)
        const snapshot = await collectionRef.get()
        const pens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        console.log(`[getPenInfo] Successfully retrieved ${pens.length} pens`)
        return {
          success: true,
          message: `Found ${pens.length} pens`,
          data: pens
        }
      }
    } catch (error: any) {
      console.error('[getPenInfo] Error occurred:', {
        error: error,
        message: error.message,
        code: error.code,
        userId: userId,
        penId: penId,
        stack: error.stack
      })

      // Provide more specific error messages based on error type
      let errorMessage = "Failed to get pen information"
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your Firestore security rules."
      } else if (error.code === 'unavailable') {
        errorMessage = "Database temporarily unavailable. Please try again."
      } else if (error.message) {
        errorMessage = `Failed to get pen information: ${error.message}`
      }

      return {
        success: false,
        message: errorMessage,
        error: error.code || error.message
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
        const inventoryQuery = adminDb.collection(`users/${userId}/inventory`).where("name", "==", itemName)
        const snapshot = await inventoryQuery.get()
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return {
          success: true,
          message: items.length > 0 ? "Item found" : "Item not found",
          data: items
        }
      } else {
        const snapshot = await adminDb.collection(`users/${userId}/inventory`).get()
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

  /**
   * Get all cattle with summary statistics
   */
  async getAllCattle(userId: string): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const snapshot = await adminDb.collection(`users/${userId}/cattle`).get()
      const cattle = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Group by pen
      const byPen: Record<string, any[]> = {}
      cattle.forEach(c => {
        const penId = (c as any).penId || 'unassigned'
        if (!byPen[penId]) byPen[penId] = []
        byPen[penId].push(c)
      })

      return {
        success: true,
        message: `You have ${cattle.length} cattle total`,
        data: {
          totalCount: cattle.length,
          cattle: cattle,
          byPen: byPen,
          penSummary: Object.entries(byPen).map(([penId, animals]) => ({
            penId,
            count: animals.length
          }))
        }
      }
    } catch (error: any) {
      console.error("Error getting all cattle:", error)
      return {
        success: false,
        message: "Failed to get cattle information",
        error: error.message
      }
    }
  }

  /**
   * Get farm summary with comprehensive statistics
   */
  async getFarmSummary(userId: string): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      // Get all data in parallel
      const [cattleSnapshot, pensSnapshot, inventorySnapshot] = await Promise.all([
        adminDb.collection(`users/${userId}/cattle`).get(),
        adminDb.collection(`users/${userId}/pens`).get(),
        adminDb.collection(`users/${userId}/inventory`).get()
      ])

      const cattle = cattleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const pens = pensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as InventoryItem }))

      // Calculate statistics
      const totalCattle = cattle.length
      const totalPens = pens.length
      const totalInventoryItems = inventory.length

      // Inventory value
      const totalInventoryValue = inventory.reduce((sum, item) => {
        const itemData = item as InventoryItem
        return sum + (itemData.totalValue || 0)
      }, 0)

      // Low stock items
      const lowStockItems = inventory.filter(item => {
        const itemData = item as InventoryItem
        return itemData.quantityOnHand <= itemData.reorderPoint
      })

      // Cattle by pen
      const cattleByPen: Record<string, number> = {}
      cattle.forEach(c => {
        const penId = (c as any).penId || 'unassigned'
        cattleByPen[penId] = (cattleByPen[penId] || 0) + 1
      })

      return {
        success: true,
        message: "Farm summary retrieved successfully",
        data: {
          cattle: {
            total: totalCattle,
            byPen: cattleByPen
          },
          pens: {
            total: totalPens,
            penList: pens.map(p => ({ id: p.id, name: (p as any).name, capacity: (p as any).capacity }))
          },
          inventory: {
            total: totalInventoryItems,
            totalValue: totalInventoryValue,
            lowStockCount: lowStockItems.length,
            lowStockItems: lowStockItems.map(item => ({
              name: (item as InventoryItem).name,
              quantity: (item as InventoryItem).quantityOnHand,
              unit: (item as InventoryItem).unit
            }))
          }
        }
      }
    } catch (error: any) {
      console.error("Error getting farm summary:", error)
      return {
        success: false,
        message: "Failed to get farm summary",
        error: error.message
      }
    }
  }

  /**
   * Get cattle count by pen
   */
  async getCattleCountByPen(userId: string): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const [cattleSnapshot, pensSnapshot] = await Promise.all([
        adminDb.collection(`users/${userId}/cattle`).get(),
        adminDb.collection(`users/${userId}/pens`).get()
      ])

      const cattle = cattleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const pens = pensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Create pen map
      const penMap: Record<string, any> = {}
      pens.forEach(p => {
        penMap[p.id] = {
          id: p.id,
          name: (p as any).name,
          capacity: (p as any).capacity,
          count: 0
        }
      })

      // Count cattle per pen
      cattle.forEach(c => {
        const penId = (c as any).penId
        if (penId && penMap[penId]) {
          penMap[penId].count++
        }
      })

      const penSummary = Object.values(penMap)

      return {
        success: true,
        message: `Cattle distribution across ${penSummary.length} pens`,
        data: penSummary
      }
    } catch (error: any) {
      console.error("Error getting cattle count by pen:", error)
      return {
        success: false,
        message: "Failed to get cattle count by pen",
        error: error.message
      }
    }
  }

  /**
   * Add cattle
   */
  async addCattle(userId: string, params: AddCattleParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const id = `cattle_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      // Use smart defaults for missing fields
      const tagNumber = params.tagNumber || `AUTO_${Math.random().toString().slice(2, 6)}`
      const breed = params.breed || "Mixed"
      const sex = (params.sex || "Unknown") as any
      const weight = params.weight !== undefined && params.weight !== null ? params.weight : 0

      const cattle: Cattle = {
        id,
        tagNumber: tagNumber,
        name: params.name,
        breed: breed,
        sex: sex,
        birthDate: params.birthDate,
        purchaseDate: params.purchaseDate,
        purchasePrice: params.purchasePrice,
        purchaseWeight: params.purchaseWeight,
        weight: weight,
        penId: params.penId,
        barnId: params.barnId,
        batchId: params.batchId,
        status: "Active",
        stage: (params.stage || "receiving") as any,
        healthStatus: "Healthy",
        identificationMethod: "Visual Tag",
        lot: "default",
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      }

      const docRef = adminDb.collection(`users/${userId}/cattle`).doc(id)
      const cattleData = Object.fromEntries(
        Object.entries(cattle).filter(([_, v]) => v !== undefined)
      )
      await docRef.set(cattleData)

      return {
        success: true,
        message: `Successfully added cattle #${tagNumber}`,
        data: cattle
      }
    } catch (error: any) {
      console.error("Error adding cattle:", error)
      return {
        success: false,
        message: "Failed to add cattle",
        error: error.message
      }
    }
  }

  /**
   * Update cattle
   */
  async updateCattle(userId: string, params: UpdateCattleParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleId = params.cattleId

      // Find by tag number if cattleId not provided
      if (!cattleId && params.tagNumber) {
        const cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("tagNumber", "==", params.tagNumber)
        const snapshot = await cattleQuery.get()
        if (!snapshot.empty) {
          cattleId = snapshot.docs[0].id
        }
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle not found",
          error: "NOT_FOUND"
        }
      }

      const docRef = adminDb.collection(`users/${userId}/cattle`).doc(cattleId)
      const updates = Object.fromEntries(
        Object.entries({
          ...params,
          cattleId: undefined,
          tagNumber: undefined,
          updatedAt: new Date().toISOString()
        }).filter(([_, v]) => v !== undefined)
      )

      await docRef.update(updates)

      return {
        success: true,
        message: `Successfully updated cattle #${params.tagNumber || cattleId}`,
        data: updates
      }
    } catch (error: any) {
      console.error("Error updating cattle:", error)
      return {
        success: false,
        message: "Failed to update cattle",
        error: error.message
      }
    }
  }

  /**
   * Delete cattle
   */
  async deleteCattle(userId: string, params: DeleteCattleParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleId = params.cattleId

      // Find by tag number if cattleId not provided
      if (!cattleId && params.tagNumber) {
        const cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("tagNumber", "==", params.tagNumber)
        const snapshot = await cattleQuery.get()
        if (!snapshot.empty) {
          cattleId = snapshot.docs[0].id
        }
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle not found",
          error: "NOT_FOUND"
        }
      }

      const docRef = adminDb.collection(`users/${userId}/cattle`).doc(cattleId)
      await docRef.delete()

      return {
        success: true,
        message: `Successfully deleted cattle #${params.tagNumber || cattleId}`,
        data: { cattleId }
      }
    } catch (error: any) {
      console.error("Error deleting cattle:", error)
      return {
        success: false,
        message: "Failed to delete cattle",
        error: error.message
      }
    }
  }

  /**
   * Add weight record
   */
  async addWeightRecord(userId: string, params: AddWeightRecordParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      let cattleId = params.cattleId

      // Find by tag number if cattleId not provided
      if (!cattleId && params.tagNumber) {
        const cattleQuery = adminDb.collection(`users/${userId}/cattle`).where("tagNumber", "==", params.tagNumber)
        const snapshot = await cattleQuery.get()
        if (!snapshot.empty) {
          cattleId = snapshot.docs[0].id
        }
      }

      if (!cattleId) {
        return {
          success: false,
          message: "Cattle not found",
          error: "NOT_FOUND"
        }
      }

      const recordId = `weight_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      const weightRecord = {
        id: recordId,
        cattleId,
        date: params.date || now,
        weight: params.weight,
        notes: params.notes,
        createdAt: now
      }

      const docRef = adminDb.collection(`users/${userId}/cattle/${cattleId}/weightRecords`).doc(recordId)
      await docRef.set(weightRecord)

      // Update cattle weight
      const cattleRef = adminDb.collection(`users/${userId}/cattle`).doc(cattleId)
      await cattleRef.update({
        weight: params.weight,
        updatedAt: now
      })

      return {
        success: true,
        message: `Successfully added weight record: ${params.weight} lbs for cattle #${params.tagNumber || cattleId}`,
        data: weightRecord
      }
    } catch (error: any) {
      console.error("Error adding weight record:", error)
      return {
        success: false,
        message: "Failed to add weight record",
        error: error.message
      }
    }
  }

  /**
   * Add barn
   */
  async addBarn(userId: string, params: AddBarnParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    // Require at minimum a name
    if (!params.name) {
      return {
        success: false,
        message: "Please provide a barn name",
        error: "MISSING_NAME"
      }
    }

    try {
      const id = `barn_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      // Use smart default for location
      const location = params.location || "Main Area"

      const barn = {
        id,
        name: params.name,
        location: location,
        totalPens: 0,
        totalCapacity: 0,
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      }

      const docRef = adminDb.collection(`users/${userId}/barns`).doc(id)
      const barnData = Object.fromEntries(
        Object.entries(barn).filter(([_, v]) => v !== undefined)
      )
      await docRef.set(barnData)

      return {
        success: true,
        message: `Successfully added barn "${params.name}"`,
        data: barn
      }
    } catch (error: any) {
      console.error("Error adding barn:", error)
      return {
        success: false,
        message: "Failed to add barn",
        error: error.message
      }
    }
  }

  /**
   * Add pen
   */
  async addPen(userId: string, params: AddPenParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    // Require at minimum a name
    if (!params.name) {
      return {
        success: false,
        message: "Please provide a pen name",
        error: "MISSING_NAME"
      }
    }

    try {
      const id = `pen_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = new Date().toISOString()

      // Use smart defaults
      const capacity = params.capacity !== undefined && params.capacity !== null ? params.capacity : 50

      const pen = {
        id,
        name: params.name,
        barnId: params.barnId,
        capacity: capacity,
        currentCount: 0,
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      }

      const docRef = adminDb.collection(`users/${userId}/pens`).doc(id)
      const penData = Object.fromEntries(
        Object.entries(pen).filter(([_, v]) => v !== undefined)
      )
      await docRef.set(penData)

      return {
        success: true,
        message: `Successfully added pen "${params.name}" with capacity ${capacity}`,
        data: pen
      }
    } catch (error: any) {
      console.error("Error adding pen:", error)
      return {
        success: false,
        message: "Failed to add pen",
        error: error.message
      }
    }
  }

  /**
   * Delete pen
   */
  async deletePen(userId: string, params: DeletePenParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const docRef = adminDb.collection(`users/${userId}/pens`).doc(params.penId)
      await docRef.delete()

      return {
        success: true,
        message: `Successfully deleted pen`,
        data: { penId: params.penId }
      }
    } catch (error: any) {
      console.error("Error deleting pen:", error)
      return {
        success: false,
        message: "Failed to delete pen",
        error: error.message
      }
    }
  }

  /**
   * Delete barn
   */
  async deleteBarn(userId: string, params: DeleteBarnParams): Promise<ActionResult> {
    if (!userId) {
      return {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED"
      }
    }

    try {
      const docRef = adminDb.collection(`users/${userId}/barns`).doc(params.barnId)
      await docRef.delete()

      return {
        success: true,
        message: `Successfully deleted barn`,
        data: { barnId: params.barnId }
      }
    } catch (error: any) {
      console.error("Error deleting barn:", error)
      return {
        success: false,
        message: "Failed to delete barn",
        error: error.message
      }
    }
  }
}

export const actionExecutor = new AgentActionExecutor()
