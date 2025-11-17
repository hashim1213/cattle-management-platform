// Enhanced Feed Inventory and Allocation System

export type FeedCategory =
  | "corn-silage"
  | "haylage"
  | "hay-alfalfa"
  | "hay-grass"
  | "hay-mixed"
  | "straw"
  | "shell-corn"
  | "barley"
  | "oats"
  | "grain-mix"
  | "protein-supplement"
  | "mineral-supplement"
  | "vitamin-supplement"
  | "distillers-grains"
  | "wheat-middlings"
  | "canola-meal"
  | "other"

export type FeedSource = "self-produced" | "purchased" | "other"

// Helper function to get display name for feed categories
export function getFeedCategoryLabel(category: FeedCategory): string {
  const labels: Record<FeedCategory, string> = {
    "corn-silage": "Corn Silage",
    "haylage": "Haylage",
    "hay-alfalfa": "Alfalfa Hay",
    "hay-grass": "Grass Hay",
    "hay-mixed": "Mixed Hay",
    "straw": "Straw",
    "shell-corn": "Shell Corn",
    "barley": "Barley",
    "oats": "Oats",
    "grain-mix": "Grain Mix",
    "protein-supplement": "Protein Supplement",
    "mineral-supplement": "Mineral Supplement",
    "vitamin-supplement": "Vitamin Supplement",
    "distillers-grains": "Distillers Grains (DDG)",
    "wheat-middlings": "Wheat Middlings",
    "canola-meal": "Canola Meal",
    "other": "Other"
  }
  return labels[category] || category
}

// Get all feed categories with labels for dropdowns
export function getFeedCategoryOptions(): Array<{ value: FeedCategory; label: string }> {
  const categories: FeedCategory[] = [
    "corn-silage",
    "haylage",
    "hay-alfalfa",
    "hay-grass",
    "hay-mixed",
    "straw",
    "shell-corn",
    "barley",
    "oats",
    "grain-mix",
    "protein-supplement",
    "mineral-supplement",
    "vitamin-supplement",
    "distillers-grains",
    "wheat-middlings",
    "canola-meal",
    "other"
  ]
  return categories.map(cat => ({ value: cat, label: getFeedCategoryLabel(cat) }))
}

// Enhanced feed inventory item
export interface FeedInventoryItem {
  id: string
  name: string
  category: FeedCategory
  source: FeedSource
  quantityOnHand: number
  unit: "lbs" | "tons" | "bales" | "bags" | "bushels"
  costPerUnit: number
  totalCost: number
  supplier?: string
  purchaseDate?: string
  harvestDate?: string // For self-produced
  receiptImageUrl?: string // For OCR
  storageLocation: string
  moistureContent?: number
  quality?: "excellent" | "good" | "fair" | "poor"
  notes?: string
  createdAt: string
  updatedAt: string
}

// Feed batch allocation to a pen
export interface FeedAllocation {
  id: string
  penId: string
  penName: string
  barnId?: string
  barnName?: string
  date: string
  feedItems: {
    feedId: string
    feedName: string
    quantity: number
    unit: string
    costPerUnit: number
    totalCost: number
  }[]
  totalBatchWeight: number
  headCount: number
  costPerHead: number
  mixerScaleWeight?: number // From Bluetooth scale integration
  deliveredBy: string
  notes?: string
  createdAt: string
}

// Feed mixer batch (for scale integration)
export interface FeedMixerBatch {
  id: string
  batchNumber: string
  date: string
  targetPenId?: string
  ingredients: {
    feedId: string
    feedName: string
    targetWeight: number
    actualWeight: number
    unit: string
  }[]
  totalWeight: number
  scaleConnected: boolean
  scaleId?: string
  createdAt: string
}

// Historical feed usage analytics
export interface FeedUsageStats {
  totalCost: number
  totalWeight: number
  averageCostPerHead: number
  averageDailyFeedPerHead: number
  byPen: Record<
    string,
    {
      penName: string
      totalCost: number
      totalWeight: number
      allocations: number
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
}

class EnhancedFeedStore {
  private static instance: EnhancedFeedStore
  private inventory: FeedInventoryItem[] = []
  private allocations: FeedAllocation[] = []
  private mixerBatches: FeedMixerBatch[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): EnhancedFeedStore {
    if (!EnhancedFeedStore.instance) {
      EnhancedFeedStore.instance = new EnhancedFeedStore()
    }
    return EnhancedFeedStore.instance
  }

  private load() {
    // Removed localStorage caching for realtime data loading
    this.inventory = []
    this.allocations = []
    this.mixerBatches = []
  }

  private save() {
    // Removed localStorage caching for realtime data loading
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  // Inventory operations
  addInventoryItem(item: Omit<FeedInventoryItem, "id" | "createdAt" | "updatedAt">): FeedInventoryItem {
    const newItem: FeedInventoryItem = {
      ...item,
      id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      totalCost: item.quantityOnHand * item.costPerUnit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.inventory.push(newItem)
    this.save()
    return newItem
  }

  updateInventoryItem(id: string, updates: Partial<FeedInventoryItem>): FeedInventoryItem | null {
    const index = this.inventory.findIndex((item) => item.id === id)
    if (index === -1) return null

    // Recalculate total cost if quantity or cost per unit changed
    const updatedItem = { ...this.inventory[index], ...updates }
    if (updates.quantityOnHand !== undefined || updates.costPerUnit !== undefined) {
      updatedItem.totalCost = updatedItem.quantityOnHand * updatedItem.costPerUnit
    }

    this.inventory[index] = {
      ...updatedItem,
      updatedAt: new Date().toISOString(),
    }
    this.save()
    return this.inventory[index]
  }

  adjustInventoryQuantity(id: string, quantityDelta: number, reason: string): FeedInventoryItem | null {
    const item = this.inventory.find((i) => i.id === id)
    if (!item) return null

    const newQuantity = item.quantityOnHand + quantityDelta
    if (newQuantity < 0) {
      console.error("Cannot reduce inventory below zero")
      return null
    }

    return this.updateInventoryItem(id, {
      quantityOnHand: newQuantity,
      notes: `${item.notes || ""}\n${new Date().toLocaleDateString()}: ${reason} (${quantityDelta > 0 ? "+" : ""}${quantityDelta} ${item.unit})`.trim(),
    })
  }

  getInventory(): FeedInventoryItem[] {
    return this.inventory
  }

  getInventoryItem(id: string): FeedInventoryItem | undefined {
    return this.inventory.find((item) => item.id === id)
  }

  // Feed allocation operations
  addFeedAllocation(allocation: Omit<FeedAllocation, "id" | "createdAt">): FeedAllocation {
    const newAllocation: FeedAllocation = {
      ...allocation,
      id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    // Reduce inventory for each feed item
    allocation.feedItems.forEach((item) => {
      this.adjustInventoryQuantity(
        item.feedId,
        -item.quantity,
        `Allocated to ${allocation.penName} on ${allocation.date}`
      )
    })

    this.allocations.unshift(newAllocation)

    // Limit to 10000 allocations
    if (this.allocations.length > 10000) {
      this.allocations = this.allocations.slice(0, 10000)
    }

    this.save()
    return newAllocation
  }

  getAllocations(): FeedAllocation[] {
    return this.allocations
  }

  getPenAllocations(penId: string): FeedAllocation[] {
    return this.allocations.filter((a) => a.penId === penId)
  }

  getBarnAllocations(barnId: string): FeedAllocation[] {
    return this.allocations.filter((a) => a.barnId === barnId)
  }

  // Mixer batch operations
  addMixerBatch(batch: Omit<FeedMixerBatch, "id" | "createdAt">): FeedMixerBatch {
    const newBatch: FeedMixerBatch = {
      ...batch,
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    this.mixerBatches.push(newBatch)
    this.save()
    return newBatch
  }

  getMixerBatches(): FeedMixerBatch[] {
    return this.mixerBatches
  }

  // Analytics
  getFeedUsageStats(dateRange?: { start: string; end: string }): FeedUsageStats {
    let allocations = this.allocations

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      allocations = allocations.filter((a) => {
        const date = new Date(a.date)
        return date >= start && date <= end
      })
    }

    const totalCost = allocations.reduce((sum, a) => sum + a.feedItems.reduce((s, f) => s + f.totalCost, 0), 0)
    const totalWeight = allocations.reduce((sum, a) => sum + a.totalBatchWeight, 0)
    const totalHeadDays = allocations.reduce((sum, a) => sum + a.headCount, 0)
    const averageCostPerHead = totalHeadDays > 0 ? totalCost / totalHeadDays : 0
    const averageDailyFeedPerHead = totalHeadDays > 0 ? totalWeight / totalHeadDays : 0

    // By pen
    const byPen: Record<string, any> = {}
    allocations.forEach((a) => {
      if (!byPen[a.penId]) {
        byPen[a.penId] = {
          penName: a.penName,
          totalCost: 0,
          totalWeight: 0,
          allocations: 0,
          totalHeadDays: 0,
        }
      }
      byPen[a.penId].totalCost += a.feedItems.reduce((s, f) => s + f.totalCost, 0)
      byPen[a.penId].totalWeight += a.totalBatchWeight
      byPen[a.penId].allocations += 1
      byPen[a.penId].totalHeadDays += a.headCount
    })

    // Calculate average cost per head for each pen
    Object.keys(byPen).forEach((penId) => {
      byPen[penId].averageCostPerHead =
        byPen[penId].totalHeadDays > 0 ? byPen[penId].totalCost / byPen[penId].totalHeadDays : 0
      delete byPen[penId].totalHeadDays
    })

    // By feed type
    const byFeedType: Record<string, any> = {}
    allocations.forEach((a) => {
      a.feedItems.forEach((f) => {
        if (!byFeedType[f.feedId]) {
          byFeedType[f.feedId] = {
            feedName: f.feedName,
            totalUsed: 0,
            totalCost: 0,
            unit: f.unit,
          }
        }
        byFeedType[f.feedId].totalUsed += f.quantity
        byFeedType[f.feedId].totalCost += f.totalCost
      })
    })

    return {
      totalCost,
      totalWeight,
      averageCostPerHead,
      averageDailyFeedPerHead,
      byPen,
      byFeedType,
    }
  }

  // Get pen feed costs for a date range
  getPenFeedCosts(penId: string, dateRange?: { start: string; end: string }): number {
    let allocations = this.getPenAllocations(penId)

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      allocations = allocations.filter((a) => {
        const date = new Date(a.date)
        return date >= start && date <= end
      })
    }

    return allocations.reduce((sum, a) => sum + a.feedItems.reduce((s, f) => s + f.totalCost, 0), 0)
  }

  // Low inventory alerts
  getLowInventoryItems(threshold: number = 0.2): FeedInventoryItem[] {
    // Return items that are below 20% of their typical quantity
    // This is a simplified version - could be enhanced with historical data
    return this.inventory.filter((item) => {
      // For self-produced items, warn if below certain thresholds
      if (item.source === "self-produced") {
        if (item.category === "hay" && item.quantityOnHand < 1000) return true
        if (item.category === "corn-silage" && item.quantityOnHand < 50) return true
      }
      // For purchased items, warn if below certain thresholds
      if (item.source === "purchased") {
        if (item.category === "supplement" && item.quantityOnHand < 10) return true
        if (item.category === "mineral" && item.quantityOnHand < 5) return true
      }
      return false
    })
  }

  // Get total inventory value
  getTotalInventoryValue(): number {
    return this.inventory.reduce((sum, item) => sum + item.totalCost, 0)
  }
}

export const enhancedFeedStore = EnhancedFeedStore.getInstance()
