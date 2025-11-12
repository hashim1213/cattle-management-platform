// Core Inventory Service - Handles all inventory operations with atomic transactions

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

class InventoryService {
  private static instance: InventoryService
  private inventory: InventoryItem[] = []
  private transactions: InventoryTransaction[] = []
  private alerts: InventoryAlert[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  private load() {
    if (typeof window === "undefined") return

    // Load inventory
    const inventoryData = localStorage.getItem("unifiedInventory")
    if (inventoryData) {
      this.inventory = JSON.parse(inventoryData)
    } else {
      // Start with empty inventory (no sample data)
      this.inventory = []
    }

    // Load transactions
    const transactionsData = localStorage.getItem("inventoryTransactions")
    if (transactionsData) {
      this.transactions = JSON.parse(transactionsData)
    }

    // Load alerts
    const alertsData = localStorage.getItem("inventoryAlerts")
    if (alertsData) {
      this.alerts = JSON.parse(alertsData)
    }

    // Check for low stock and expiring items
    this.checkAndCreateAlerts()
  }

  private save() {
    if (typeof window === "undefined") return
    localStorage.setItem("unifiedInventory", JSON.stringify(this.inventory))
    localStorage.setItem("inventoryTransactions", JSON.stringify(this.transactions))
    localStorage.setItem("inventoryAlerts", JSON.stringify(this.alerts))
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  // ==================== CORE OPERATIONS ====================

  /**
   * Check if sufficient inventory is available
   * ALWAYS call this before attempting to deduct
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
   * Deduct from inventory (ATOMIC OPERATION)
   * This is the critical function used by health and feed services
   *
   * Steps:
   * 1. Verify item exists
   * 2. Check sufficient quantity
   * 3. Update inventory quantity
   * 4. Create transaction log
   * 5. Check reorder point
   * 6. Save all changes atomically
   * 7. Notify listeners
   */
  async deduct(params: DeductParams): Promise<InventoryTransaction> {
    // 1. Find item
    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    // 2. Verify sufficient quantity
    if (item.quantityOnHand < params.quantity) {
      throw new Error(
        `Insufficient inventory: ${item.name} - ` +
        `Need ${params.quantity}${item.unit}, have ${item.quantityOnHand}${item.unit}`
      )
    }

    // 3. Calculate new quantity
    const quantityBefore = item.quantityOnHand
    const quantityAfter = quantityBefore - params.quantity

    if (quantityAfter < 0) {
      throw new Error("Cannot reduce inventory below zero")
    }

    // 4. Create transaction record BEFORE updating inventory
    const transaction: InventoryTransaction = {
      id: `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // 5. Update inventory quantity and value
    item.quantityOnHand = quantityAfter
    item.totalValue = quantityAfter * item.costPerUnit
    item.updatedAt = new Date().toISOString()

    // 6. Add transaction to log
    this.transactions.unshift(transaction)

    // Limit transaction log to 10000 entries
    if (this.transactions.length > 10000) {
      this.transactions = this.transactions.slice(0, 10000)
    }

    // 7. Check if we hit reorder point
    if (quantityAfter <= item.reorderPoint && !item.lowStockAlertSent) {
      this.createLowStockAlert(item)
      item.lowStockAlertSent = true
    }

    // 8. Save all changes atomically
    this.save()

    return transaction
  }

  /**
   * Add to inventory (purchases, returns, adjustments)
   */
  async add(params: AddParams): Promise<InventoryTransaction> {
    // 1. Find item
    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    // 2. Calculate new quantity
    const quantityBefore = item.quantityOnHand
    const quantityAfter = quantityBefore + params.quantity

    // 3. Update cost per unit if provided
    if (params.costPerUnit !== undefined) {
      // Weighted average cost
      const totalCost = (item.quantityOnHand * item.costPerUnit) + (params.quantity * params.costPerUnit)
      item.costPerUnit = totalCost / quantityAfter
    }

    // 4. Create transaction record
    const transaction: InventoryTransaction = {
      id: `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // 5. Update inventory
    item.quantityOnHand = quantityAfter
    item.totalValue = quantityAfter * item.costPerUnit
    item.updatedAt = new Date().toISOString()

    // 6. Clear low stock alert if we're back above reorder point
    if (quantityAfter > item.reorderPoint) {
      item.lowStockAlertSent = false
      this.resolveLowStockAlert(item.id)
    }

    // 7. Add transaction to log
    this.transactions.unshift(transaction)

    // Limit transaction log
    if (this.transactions.length > 10000) {
      this.transactions = this.transactions.slice(0, 10000)
    }

    // 8. Save
    this.save()

    return transaction
  }

  /**
   * Adjust inventory quantity (manual correction)
   */
  async adjust(params: AdjustParams): Promise<InventoryTransaction> {
    const item = this.inventory.find((i) => i.id === params.itemId)
    if (!item) {
      throw new Error(`Inventory item not found: ${params.itemId}`)
    }

    if (params.newQuantity < 0) {
      throw new Error("Quantity cannot be negative")
    }

    const quantityBefore = item.quantityOnHand
    const quantityChange = params.newQuantity - quantityBefore

    const transaction: InventoryTransaction = {
      id: `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // Update inventory
    item.quantityOnHand = params.newQuantity
    item.totalValue = params.newQuantity * item.costPerUnit
    item.updatedAt = new Date().toISOString()

    // Check alerts
    if (params.newQuantity <= item.reorderPoint && !item.lowStockAlertSent) {
      this.createLowStockAlert(item)
      item.lowStockAlertSent = true
    } else if (params.newQuantity > item.reorderPoint) {
      item.lowStockAlertSent = false
      this.resolveLowStockAlert(item.id)
    }

    this.transactions.unshift(transaction)
    this.save()

    return transaction
  }

  // ==================== INVENTORY MANAGEMENT ====================

  /**
   * Get all inventory items
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
   * Delete an inventory item
   */
  deleteItem(itemId: string): void {
    const index = this.inventory.findIndex((i) => i.id === itemId)
    if (index === -1) {
      throw new Error(`Inventory item not found: ${itemId}`)
    }
    this.inventory.splice(index, 1)
    this.save()
  }

  /**
   * Clear all inventory (for resetting/testing)
   */
  clearAll(): void {
    this.inventory = []
    this.transactions = []
    this.alerts = []
    this.save()
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
  addInventoryItem(item: Omit<InventoryItem, "id" | "totalValue" | "lowStockAlertSent" | "createdAt" | "updatedAt">): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      totalValue: item.quantityOnHand * item.costPerUnit,
      lowStockAlertSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.inventory.push(newItem)
    this.save()

    return newItem
  }

  /**
   * Update inventory item metadata (not quantity - use deduct/add/adjust for that)
   */
  updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): InventoryItem | null {
    const index = this.inventory.findIndex((i) => i.id === itemId)
    if (index === -1) return null

    // Don't allow direct quantity updates - must use deduct/add/adjust
    if (updates.quantityOnHand !== undefined) {
      delete updates.quantityOnHand
    }

    this.inventory[index] = {
      ...this.inventory[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.save()
    return this.inventory[index]
  }

  /**
   * Delete inventory item (only if quantity is 0)
   */
  deleteInventoryItem(itemId: string): boolean {
    const item = this.inventory.find((i) => i.id === itemId)
    if (!item) return false

    if (item.quantityOnHand > 0) {
      throw new Error("Cannot delete inventory item with quantity > 0. Adjust to 0 first.")
    }

    this.inventory = this.inventory.filter((i) => i.id !== itemId)
    this.save()
    return true
  }

  // ==================== TRANSACTION HISTORY ====================

  /**
   * Get all transactions
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

  /**
   * Update transaction (for linking to related records)
   */
  updateTransaction(transactionId: string, updates: Partial<InventoryTransaction>): void {
    const index = this.transactions.findIndex((t) => t.id === transactionId)
    if (index !== -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        ...updates
      }
      this.save()
    }
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
      alerts: this.alerts.filter((a) => !a.resolved)
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

  /**
   * Check and create alerts for low stock, expired, expiring items
   */
  private checkAndCreateAlerts(): void {
    // Check low stock
    this.inventory.forEach((item) => {
      if (item.quantityOnHand <= item.reorderPoint && !item.lowStockAlertSent) {
        this.createLowStockAlert(item)
        item.lowStockAlertSent = true
      }
    })

    // Check expired items
    this.inventory.forEach((item) => {
      if (item.expirationDate) {
        const expiryDate = new Date(item.expirationDate)
        const today = new Date()

        // Expired
        if (expiryDate < today) {
          const existingAlert = this.alerts.find(
            (a) => a.itemId === item.id && a.alertType === "expired" && !a.resolved
          )
          if (!existingAlert) {
            this.createExpiredAlert(item)
          }
        }

        // Expiring soon (30 days)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        if (expiryDate <= thirtyDaysFromNow && expiryDate >= today) {
          const existingAlert = this.alerts.find(
            (a) => a.itemId === item.id && a.alertType === "expiring_soon" && !a.resolved
          )
          if (!existingAlert) {
            this.createExpiringSoonAlert(item)
          }
        }
      }
    })
  }

  private createLowStockAlert(item: InventoryItem): void {
    const alert: InventoryAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: item.id,
      itemName: item.name,
      alertType: "low_stock",
      severity: item.quantityOnHand === 0 ? "critical" : "warning",
      message: `${item.name} is low (${item.quantityOnHand}${item.unit}). Reorder point: ${item.reorderPoint}${item.unit}`,
      currentQuantity: item.quantityOnHand,
      reorderPoint: item.reorderPoint,
      createdAt: new Date().toISOString(),
      resolved: false
    }

    this.alerts.push(alert)
  }

  private createExpiredAlert(item: InventoryItem): void {
    const alert: InventoryAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: item.id,
      itemName: item.name,
      alertType: "expired",
      severity: "critical",
      message: `${item.name} has expired (Exp: ${item.expirationDate})`,
      expirationDate: item.expirationDate,
      createdAt: new Date().toISOString(),
      resolved: false
    }

    this.alerts.push(alert)
  }

  private createExpiringSoonAlert(item: InventoryItem): void {
    const alert: InventoryAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: item.id,
      itemName: item.name,
      alertType: "expiring_soon",
      severity: "warning",
      message: `${item.name} expires soon (${item.expirationDate})`,
      expirationDate: item.expirationDate,
      createdAt: new Date().toISOString(),
      resolved: false
    }

    this.alerts.push(alert)
  }

  private resolveLowStockAlert(itemId: string): void {
    const alert = this.alerts.find(
      (a) => a.itemId === itemId && a.alertType === "low_stock" && !a.resolved
    )
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
    }
  }

  /**
   * Resolve alert manually
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
      this.save()
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): InventoryAlert[] {
    return this.alerts.filter((a) => !a.resolved)
  }
}

// Export Firebase service as default - provides real-time sync
export { firebaseInventoryService as inventoryService } from "./inventory-service-firebase"

// Keep localStorage service available for legacy/offline use
const localStorageService = InventoryService.getInstance()
export { localStorageService }
