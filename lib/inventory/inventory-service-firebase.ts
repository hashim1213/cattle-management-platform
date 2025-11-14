// Firebase-based Inventory Service - Replaces localStorage with Firestore
// This ensures inventory persists and syncs with the AI agent

import { db } from "@/lib/firebase"
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
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from "firebase/firestore"
import {
  InventoryItem,
  InventoryTransaction,
  InventoryAlert,
  InventoryStatus,
  AvailabilityCheck,
  TransactionType,
  InventoryCategory,
  InventoryUnit,
  isDrugCategory,
  isFeedCategory
} from "./inventory-types"

interface DeductParams {
  itemId: string
  quantity: number
  reason: string
  performedBy: string
  relatedRecordType?: "health_record" | "feed_allocation" | "bulk_health_record"
  relatedRecordId?: string
  notes?: string
}

interface AddParams {
  itemId: string
  quantity: number
  reason: string
  performedBy: string
  costPerUnit?: number
  notes?: string
}

interface AdjustParams {
  itemId: string
  newQuantity: number
  reason: string
  performedBy: string
  notes?: string
}

// Helper function to remove undefined values from objects before saving to Firestore
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

class FirebaseInventoryService {
  private static instance: FirebaseInventoryService
  private userId: string | null = null
  private inventory: InventoryItem[] = []
  private transactions: InventoryTransaction[] = []
  private listeners = new Set<() => void>()
  private unsubscribeInventory?: () => void
  private unsubscribeTransactions?: () => void

  private constructor() {}

  static getInstance(): FirebaseInventoryService {
    if (!FirebaseInventoryService.instance) {
      FirebaseInventoryService.instance = new FirebaseInventoryService()
    }
    return FirebaseInventoryService.instance
  }

  /**
   * Initialize with user ID and set up real-time listeners
   */
  async initialize(userId: string): Promise<void> {
    if (this.userId === userId && this.unsubscribeInventory) {
      return // Already initialized for this user
    }

    // Clean up previous listeners
    this.cleanup()

    this.userId = userId

    // Set up real-time listener for inventory
    const inventoryRef = collection(db, `users/${userId}/inventory`)
    this.unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
      this.inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem))
      this.notify()
    })

    // Set up real-time listener for transactions
    const transactionsRef = query(
      collection(db, `users/${userId}/inventoryTransactions`),
      orderBy("timestamp", "desc"),
      limit(1000) // Limit to recent 1000 transactions
    )
    this.unsubscribeTransactions = onSnapshot(transactionsRef, (snapshot) => {
      this.transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryTransaction))
      this.notify()
    })
  }

  /**
   * Clean up listeners when user logs out
   */
  cleanup(): void {
    if (this.unsubscribeInventory) {
      this.unsubscribeInventory()
      this.unsubscribeInventory = undefined
    }
    if (this.unsubscribeTransactions) {
      this.unsubscribeTransactions()
      this.unsubscribeTransactions = undefined
    }
    this.inventory = []
    this.transactions = []
    this.userId = null
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  private requireUser(): string {
    if (!this.userId) {
      throw new Error("User not initialized. Call initialize(userId) first.")
    }
    return this.userId
  }

  // ==================== CORE OPERATIONS ====================

  /**
   * Check if sufficient inventory is available
   */
  async checkAvailability(itemId: string, requiredQuantity: number): Promise<AvailabilityCheck> {
    const item = this.inventory.find((i) => i.id === itemId)

    if (!item) {
      throw new Error(`Inventory item not found: ${itemId}`)
    }

    const available = item.quantityOnHand >= requiredQuantity
    const shortfall = available ? 0 : requiredQuantity - item.quantityOnHand

    return {
      available,
      currentQuantity: item.quantityOnHand,
      requiredQuantity,
      shortfall: available ? undefined : shortfall,
      itemName: item.name,
      unit: item.unit
    }
  }

  /**
   * Deduct from inventory (ATOMIC OPERATION with Firestore batch)
   */
  async deduct(params: DeductParams): Promise<InventoryTransaction> {
    const userId = this.requireUser()

    // Find item in local cache first
    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    // Verify sufficient quantity
    if (item.quantityOnHand < params.quantity) {
      throw new Error(
        `Insufficient inventory: ${item.name} - ` +
        `Need ${params.quantity}${item.unit}, have ${item.quantityOnHand}${item.unit}`
      )
    }

    // Calculate new quantity
    const quantityBefore = item.quantityOnHand
    const quantityAfter = quantityBefore - params.quantity

    if (quantityAfter < 0) {
      throw new Error("Cannot reduce inventory below zero")
    }

    // Create transaction record
    const transactionId = `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const transaction: InventoryTransaction = {
      id: transactionId,
      itemId: item.id,
      itemName: item.name,
      type: "usage",
      quantityBefore,
      quantityChange: -params.quantity,
      quantityAfter,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      costImpact: params.quantity * item.costPerUnit,
      relatedRecordType: params.relatedRecordType,
      relatedRecordId: params.relatedRecordId,
      reason: params.reason,
      performedBy: params.performedBy,
      timestamp: new Date().toISOString(),
      notes: params.notes
    }

    // Use Firestore batch for atomic update
    const batch = writeBatch(db)

    // Update inventory item
    const itemRef = doc(db, `users/${userId}/inventory`, item.id)
    batch.update(itemRef, {
      quantityOnHand: quantityAfter,
      totalValue: quantityAfter * item.costPerUnit,
      lowStockAlertSent: quantityAfter <= item.reorderPoint ? true : item.lowStockAlertSent,
      updatedAt: new Date().toISOString()
    })

    // Add transaction (remove undefined values)
    const transRef = doc(db, `users/${userId}/inventoryTransactions`, transactionId)
    batch.set(transRef, removeUndefined(transaction))

    // Commit batch
    await batch.commit()

    return transaction
  }

  /**
   * Add to inventory
   */
  async add(params: AddParams): Promise<InventoryTransaction> {
    const userId = this.requireUser()

    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    const quantityBefore = item.quantityOnHand
    const quantityAfter = quantityBefore + params.quantity

    // Calculate weighted average cost if new cost provided
    let newCostPerUnit = item.costPerUnit
    if (params.costPerUnit !== undefined) {
      const totalCost = (item.quantityOnHand * item.costPerUnit) + (params.quantity * params.costPerUnit)
      newCostPerUnit = totalCost / quantityAfter
    }

    const transactionId = `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const transaction: InventoryTransaction = {
      id: transactionId,
      itemId: item.id,
      itemName: item.name,
      type: "purchase",
      quantityBefore,
      quantityChange: params.quantity,
      quantityAfter,
      unit: item.unit,
      costPerUnit: params.costPerUnit || item.costPerUnit,
      costImpact: params.quantity * (params.costPerUnit || item.costPerUnit),
      reason: params.reason,
      performedBy: params.performedBy,
      timestamp: new Date().toISOString(),
      notes: params.notes
    }

    const batch = writeBatch(db)

    const itemRef = doc(db, `users/${userId}/inventory`, item.id)
    batch.update(itemRef, {
      quantityOnHand: quantityAfter,
      costPerUnit: newCostPerUnit,
      totalValue: quantityAfter * newCostPerUnit,
      lowStockAlertSent: quantityAfter > item.reorderPoint ? false : item.lowStockAlertSent,
      updatedAt: new Date().toISOString()
    })

    const transRef = doc(db, `users/${userId}/inventoryTransactions`, transactionId)
    batch.set(transRef, removeUndefined(transaction))

    await batch.commit()

    return transaction
  }

  /**
   * Adjust inventory quantity (manual correction)
   */
  async adjust(params: AdjustParams): Promise<InventoryTransaction> {
    const userId = this.requireUser()

    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    if (params.newQuantity < 0) {
      throw new Error("Quantity cannot be negative")
    }

    const quantityBefore = item.quantityOnHand
    const quantityChange = params.newQuantity - quantityBefore

    const transactionId = `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const transaction: InventoryTransaction = {
      id: transactionId,
      itemId: item.id,
      itemName: item.name,
      type: "adjustment",
      quantityBefore,
      quantityChange,
      quantityAfter: params.newQuantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      costImpact: quantityChange * item.costPerUnit,
      reason: params.reason,
      performedBy: params.performedBy,
      timestamp: new Date().toISOString(),
      notes: params.notes
    }

    const batch = writeBatch(db)

    const itemRef = doc(db, `users/${userId}/inventory`, item.id)
    batch.update(itemRef, {
      quantityOnHand: params.newQuantity,
      totalValue: params.newQuantity * item.costPerUnit,
      lowStockAlertSent: params.newQuantity <= item.reorderPoint ? true : false,
      updatedAt: new Date().toISOString()
    })

    const transRef = doc(db, `users/${userId}/inventoryTransactions`, transactionId)
    batch.set(transRef, removeUndefined(transaction))

    await batch.commit()

    return transaction
  }

  // ==================== INVENTORY MANAGEMENT ====================

  /**
   * Get all inventory items (from local cache)
   */
  getInventory(): InventoryItem[] {
    return this.inventory
  }

  /**
   * Get inventory item by ID
   */
  getItem(itemId: string): InventoryItem | undefined {
    return this.inventory.find((i) => i.id === itemId)
  }

  /**
   * Get inventory by category
   */
  getInventoryByCategory(category: InventoryCategory): InventoryItem[] {
    return this.inventory.filter((i) => i.category === category)
  }

  /**
   * Get all drugs
   */
  getDrugs(): InventoryItem[] {
    return this.inventory.filter((i) => isDrugCategory(i.category))
  }

  /**
   * Get all feed
   */
  getFeed(): InventoryItem[] {
    return this.inventory.filter((i) => isFeedCategory(i.category))
  }

  /**
   * Add new inventory item
   */
  async addInventoryItem(item: Omit<InventoryItem, "id" | "totalValue" | "lowStockAlertSent" | "createdAt" | "updatedAt">): Promise<InventoryItem> {
    const userId = this.requireUser()

    const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: InventoryItem = {
      ...item,
      id: itemId,
      totalValue: item.quantityOnHand * item.costPerUnit,
      lowStockAlertSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Remove undefined values before saving to Firestore
    const cleanedItem = removeUndefined(newItem)

    const itemRef = doc(db, `users/${userId}/inventory`, itemId)
    await setDoc(itemRef, cleanedItem)

    return newItem
  }

  /**
   * Update inventory item metadata
   */
  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const userId = this.requireUser()

    const item = this.inventory.find((i) => i.id === itemId)
    if (!item) return null

    // Don't allow direct quantity updates
    if (updates.quantityOnHand !== undefined) {
      delete updates.quantityOnHand
    }

    // Remove undefined values before saving to Firestore
    const cleanedUpdates = removeUndefined({
      ...updates,
      updatedAt: new Date().toISOString()
    })

    const itemRef = doc(db, `users/${userId}/inventory`, itemId)
    await updateDoc(itemRef, cleanedUpdates)

    return { ...item, ...updates, updatedAt: new Date().toISOString() }
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(itemId: string): Promise<boolean> {
    const userId = this.requireUser()

    const item = this.inventory.find((i) => i.id === itemId)
    if (!item) return false

    if (item.quantityOnHand > 0) {
      throw new Error("Cannot delete inventory item with quantity > 0. Adjust to 0 first.")
    }

    const itemRef = doc(db, `users/${userId}/inventory`, itemId)
    await deleteDoc(itemRef)

    return true
  }

  // ==================== TRANSACTION HISTORY ====================

  /**
   * Get all transactions (from local cache)
   */
  getTransactions(): InventoryTransaction[] {
    return this.transactions
  }

  /**
   * Get transactions for specific item
   */
  getItemTransactions(itemId: string): InventoryTransaction[] {
    return this.transactions.filter((t) => t.itemId === itemId)
  }

  /**
   * Get transactions for date range
   */
  getTransactionsByDateRange(startDate: string, endDate: string): InventoryTransaction[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return this.transactions.filter((t) => {
      const date = new Date(t.timestamp)
      return date >= start && date <= end
    })
  }

  // ==================== ALERTS & MONITORING ====================

  /**
   * Get inventory status summary
   */
  getInventoryStatus(): InventoryStatus {
    const totalValue = this.inventory.reduce((sum, item) => sum + item.totalValue, 0)
    const lowStockCount = this.inventory.filter((item) => item.quantityOnHand <= item.reorderPoint).length
    const expiredCount = this.inventory.filter((item) => {
      if (!item.expirationDate) return false
      return new Date(item.expirationDate) < new Date()
    }).length
    const expiringSoonCount = this.inventory.filter((item) => {
      if (!item.expirationDate) return false
      const expiryDate = new Date(item.expirationDate)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
    }).length

    return {
      totalItems: this.inventory.length,
      totalValue,
      lowStockCount,
      expiredCount,
      expiringSoonCount,
      alerts: [] // Alerts will be generated client-side from current data
    }
  }

  /**
   * Get low stock items
   */
  getLowStockItems(): InventoryItem[] {
    return this.inventory.filter((item) => item.quantityOnHand <= item.reorderPoint)
  }

  /**
   * Get expired items
   */
  getExpiredItems(): InventoryItem[] {
    return this.inventory.filter((item) => {
      if (!item.expirationDate) return false
      return new Date(item.expirationDate) < new Date()
    })
  }

  /**
   * Get expiring soon items (within 30 days)
   */
  getExpiringSoonItems(): InventoryItem[] {
    return this.inventory.filter((item) => {
      if (!item.expirationDate) return false
      const expiryDate = new Date(item.expirationDate)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
    })
  }
}

export const firebaseInventoryService = FirebaseInventoryService.getInstance()
