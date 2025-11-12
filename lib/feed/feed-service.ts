// Feed Service - Integrates feed allocations with automatic inventory deductions

import { inventoryService } from "../inventory/inventory-service"
import { InventoryTransaction } from "../inventory/inventory-types"

export interface FeedAllocationRecord {
  id: string
  penId: string
  penName: string
  date: string
  feedItems: {
    feedId: string
    feedName: string
    quantity: number
    unit: string
    inventoryTransactionId?: string
  }[]
  headCount: number
  totalWeight: number
  costPerHead: number
  totalCost: number
  deliveredBy: string
  notes?: string
  createdAt: string
}

interface AllocateFeedParams {
  penId: string
  penName: string
  headCount: number
  feedItems: Array<{
    feedInventoryId: string
    quantity: number
  }>
  deliveredBy: string
  notes?: string
  date?: string
}

interface FeedAllocationResult {
  allocation: FeedAllocationRecord
  inventoryTransactions: InventoryTransaction[]
  totalCost: number
  costPerHead: number
}

/**
 * Feed Service - Manages feed allocations with automatic inventory deductions
 *
 * KEY PRINCIPLE: Every feed allocation MUST deduct from inventory
 * This ensures accurate feed usage tracking and cost calculations
 */
class FeedService {
  private static instance: FeedService
  private allocations: FeedAllocationRecord[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): FeedService {
    if (!FeedService.instance) {
      FeedService.instance = new FeedService()
    }
    return FeedService.instance
  }

  private load() {
    if (typeof window === "undefined") return

    const allocationsData = localStorage.getItem("feedAllocationsV2")
    if (allocationsData) {
      this.allocations = JSON.parse(allocationsData)
    }
  }

  private save() {
    if (typeof window === "undefined") return
    localStorage.setItem("feedAllocationsV2", JSON.stringify(this.allocations))
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  /**
   * Allocate feed to a pen with automatic inventory deduction
   * This is the ATOMIC operation that ensures data consistency
   *
   * Steps:
   * 1. Check inventory availability for ALL feed items
   * 2. Deduct from inventory for each feed item
   * 3. Create feed allocation record
   * 4. Link all records together
   * 5. Save all changes
   */
  async allocateFeed(params: AllocateFeedParams): Promise<FeedAllocationResult> {
    // 1. Check inventory availability for ALL feed items BEFORE processing
    const availabilityChecks = await Promise.all(
      params.feedItems.map((item) =>
        inventoryService.checkAvailability(item.feedInventoryId, item.quantity)
      )
    )

    // Verify ALL items are available
    const insufficientItems = availabilityChecks.filter((check) => !check.available)
    if (insufficientItems.length > 0) {
      const errorMessages = insufficientItems.map(
        (check) =>
          `${check.itemName}: Need ${check.requiredQuantity}${check.unit}, have ${check.currentQuantity}${check.unit}`
      )
      throw new Error(
        `Insufficient feed inventory:\n${errorMessages.join("\n")}`
      )
    }

    // 2. Deduct from inventory for each feed item (ATOMIC operations)
    const inventoryTransactions: InventoryTransaction[] = []
    const feedItemsWithDetails: FeedAllocationRecord["feedItems"] = []
    let totalCost = 0
    let totalWeight = 0

    for (const feedItem of params.feedItems) {
      try {
        const inventoryItem = inventoryService.getItem(feedItem.feedInventoryId)
        if (!inventoryItem) {
          throw new Error(`Feed item not found in inventory: ${feedItem.feedInventoryId}`)
        }

        // Deduct from inventory
        const transaction = await inventoryService.deduct({
          itemId: feedItem.feedInventoryId,
          quantity: feedItem.quantity,
          reason: `Feed allocation to ${params.penName}`,
          performedBy: params.deliveredBy,
          relatedRecordType: "feed_allocation",
          relatedRecordId: "pending", // Will update after allocation record created
          notes: params.notes
        })

        inventoryTransactions.push(transaction)
        totalCost += transaction.costImpact || 0

        // Convert all to lbs for total weight calculation
        let weightInLbs = feedItem.quantity
        if (inventoryItem.unit === "tons") {
          weightInLbs = feedItem.quantity * 2000
        } else if (inventoryItem.unit === "bags") {
          weightInLbs = feedItem.quantity * 50 // Assume 50lb bags
        } else if (inventoryItem.unit === "bales") {
          weightInLbs = feedItem.quantity * 50 // Assume 50lb bales
        }
        totalWeight += weightInLbs

        feedItemsWithDetails.push({
          feedId: feedItem.feedInventoryId,
          feedName: inventoryItem.name,
          quantity: feedItem.quantity,
          unit: inventoryItem.unit,
          inventoryTransactionId: transaction.id
        })
      } catch (error) {
        // Rollback: If any deduction fails, we need to add back what was already deducted
        // For now, throw error - in production, implement proper rollback
        console.error("Feed allocation failed, inventory may be inconsistent:", error)
        throw new Error(`Feed allocation failed: ${(error as Error).message}`)
      }
    }

    // 3. Create feed allocation record
    const costPerHead = params.headCount > 0 ? totalCost / params.headCount : 0

    const allocation: FeedAllocationRecord = {
      id: `feed-alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      penId: params.penId,
      penName: params.penName,
      date: params.date || new Date().toISOString().split("T")[0],
      feedItems: feedItemsWithDetails,
      headCount: params.headCount,
      totalWeight,
      costPerHead,
      totalCost,
      deliveredBy: params.deliveredBy,
      notes: params.notes,
      createdAt: new Date().toISOString()
    }

    // 4. Update inventory transactions with allocation record ID
    for (const transaction of inventoryTransactions) {
      inventoryService.updateTransaction(transaction.id, {
        relatedRecordId: allocation.id
      })
    }

    // 5. Save allocation record
    this.allocations.unshift(allocation)

    // Limit to 10000 allocations
    if (this.allocations.length > 10000) {
      this.allocations = this.allocations.slice(0, 10000)
    }

    this.save()

    return {
      allocation,
      inventoryTransactions,
      totalCost,
      costPerHead
    }
  }

  /**
   * Get all feed allocations
   */
  getAllocations(): FeedAllocationRecord[] {
    return this.allocations
  }

  /**
   * Get allocations for specific pen
   */
  getPenAllocations(penId: string): FeedAllocationRecord[] {
    return this.allocations.filter((a) => a.penId === penId)
  }

  /**
   * Get allocations for date range
   */
  getAllocationsByDateRange(startDate: string, endDate: string): FeedAllocationRecord[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return this.allocations.filter((a) => {
      const date = new Date(a.date)
      return date >= start && date <= end
    })
  }

  /**
   * Get recent allocations (last N days)
   */
  getRecentAllocations(days: number = 30): FeedAllocationRecord[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return this.allocations.filter((a) => {
      const date = new Date(a.date)
      return date >= cutoff
    })
  }

  /**
   * Get feed usage statistics
   */
  getFeedUsageStats(dateRange?: {
    start: string
    end: string
  }): {
    totalAllocations: number
    totalCost: number
    totalWeight: number
    averageCostPerHead: number
    byPen: Record<
      string,
      {
        penName: string
        allocations: number
        totalCost: number
        totalWeight: number
        averageCostPerHead: number
      }
    >
    byFeedType: Record<
      string,
      {
        feedName: string
        totalUsed: number
        totalCost: number
        unit: string
      }
    >
  } {
    let allocations = this.allocations

    if (dateRange) {
      allocations = this.getAllocationsByDateRange(dateRange.start, dateRange.end)
    }

    const totalCost = allocations.reduce((sum, a) => sum + a.totalCost, 0)
    const totalWeight = allocations.reduce((sum, a) => sum + a.totalWeight, 0)
    const totalHeadDays = allocations.reduce((sum, a) => sum + a.headCount, 0)
    const averageCostPerHead = totalHeadDays > 0 ? totalCost / totalHeadDays : 0

    // By pen
    const byPen: Record<string, any> = {}
    allocations.forEach((a) => {
      if (!byPen[a.penId]) {
        byPen[a.penId] = {
          penName: a.penName,
          allocations: 0,
          totalCost: 0,
          totalWeight: 0,
          totalHeadDays: 0
        }
      }
      byPen[a.penId].allocations++
      byPen[a.penId].totalCost += a.totalCost
      byPen[a.penId].totalWeight += a.totalWeight
      byPen[a.penId].totalHeadDays += a.headCount
    })

    // Calculate average cost per head for each pen
    Object.keys(byPen).forEach((penId) => {
      byPen[penId].averageCostPerHead =
        byPen[penId].totalHeadDays > 0
          ? byPen[penId].totalCost / byPen[penId].totalHeadDays
          : 0
      delete byPen[penId].totalHeadDays
    })

    // By feed type
    const byFeedType: Record<string, any> = {}
    allocations.forEach((a) => {
      a.feedItems.forEach((item) => {
        if (!byFeedType[item.feedId]) {
          byFeedType[item.feedId] = {
            feedName: item.feedName,
            totalUsed: 0,
            totalCost: 0,
            unit: item.unit
          }
        }
        byFeedType[item.feedId].totalUsed += item.quantity

        // Get cost from inventory transaction if available
        if (item.inventoryTransactionId) {
          const transactions = inventoryService.getTransactions()
          const transaction = transactions.find((t) => t.id === item.inventoryTransactionId)
          if (transaction) {
            byFeedType[item.feedId].totalCost += Math.abs(transaction.costImpact || 0)
          }
        }
      })
    })

    return {
      totalAllocations: allocations.length,
      totalCost,
      totalWeight,
      averageCostPerHead,
      byPen,
      byFeedType
    }
  }

  /**
   * Get feed costs for specific pen
   */
  getPenFeedCosts(
    penId: string,
    dateRange?: { start: string; end: string }
  ): number {
    let allocations = this.getPenAllocations(penId)

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      allocations = allocations.filter((a) => {
        const date = new Date(a.date)
        return date >= start && date <= end
      })
    }

    return allocations.reduce((sum, a) => sum + a.totalCost, 0)
  }

  /**
   * Update feed allocation
   */
  updateAllocation(
    id: string,
    updates: Partial<FeedAllocationRecord>
  ): FeedAllocationRecord | null {
    const index = this.allocations.findIndex((a) => a.id === id)
    if (index === -1) return null

    // Don't allow changing feed items or quantities - that would break inventory tracking
    if (updates.feedItems) {
      delete updates.feedItems
    }

    this.allocations[index] = {
      ...this.allocations[index],
      ...updates
    }

    this.save()
    return this.allocations[index]
  }

  /**
   * Delete feed allocation (rarely used - allocations should be preserved for audit)
   * NOTE: This does NOT restore inventory - that would require manual adjustment
   */
  deleteAllocation(id: string): boolean {

    const initialLength = this.allocations.length
    this.allocations = this.allocations.filter((a) => a.id !== id)

    if (this.allocations.length < initialLength) {
      this.save()
      return true
    }

    return false
  }
}

export const feedService = FeedService.getInstance()
