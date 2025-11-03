/**
 * Batch/Group Tracking Store
 * Tracks cattle purchase groups/batches for profitability analysis
 */

export interface Batch {
  id: string
  name: string
  feederLoanNumber?: string
  purchaseDate: string
  supplier: string
  headCount: number
  averagePurchaseWeight: number
  averagePurchasePrice: number
  totalInvestment: number
  notes?: string
  cattleIds: string[] // Links to cattle in this batch
  createdAt: string
  updatedAt: string
}

const BATCHES_STORAGE_KEY = "cattle-batches"

class BatchStore {
  private batches: Batch[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadData()
  }

  private loadData() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(BATCHES_STORAGE_KEY)
      this.batches = stored ? JSON.parse(stored) : []

      // Migrate old data: calculate totalInvestment if missing
      let needsSave = false
      this.batches = this.batches.map((batch) => {
        if (batch.totalInvestment === undefined || batch.totalInvestment === null) {
          needsSave = true
          return {
            ...batch,
            totalInvestment: batch.headCount * batch.averagePurchasePrice,
            cattleIds: batch.cattleIds || [],
          }
        }
        return {
          ...batch,
          cattleIds: batch.cattleIds || [],
        }
      })

      if (needsSave) {
        localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(this.batches))
      }
    } catch (error) {
      console.error("Failed to load batch data:", error)
      this.batches = []
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(this.batches))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save batch data:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getBatches(): Batch[] {
    return [...this.batches]
  }

  getBatch(id: string): Batch | undefined {
    return this.batches.find((b) => b.id === id)
  }

  addBatch(batch: Omit<Batch, "id" | "createdAt" | "updatedAt" | "totalInvestment"> & { totalInvestment?: number }): Batch {
    // Auto-calculate totalInvestment if not provided
    const totalInvestment = batch.totalInvestment ?? (batch.headCount * batch.averagePurchasePrice)

    const newBatch: Batch = {
      ...batch,
      totalInvestment,
      cattleIds: batch.cattleIds || [],
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.batches.push(newBatch)
    this.save()
    return newBatch
  }

  updateBatch(id: string, updates: Partial<Omit<Batch, "id" | "createdAt">>): boolean {
    const index = this.batches.findIndex((b) => b.id === id)
    if (index === -1) return false

    this.batches[index] = {
      ...this.batches[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteBatch(id: string): boolean {
    const index = this.batches.findIndex((b) => b.id === id)
    if (index === -1) return false

    this.batches.splice(index, 1)
    this.save()
    return true
  }

  addCattleToBatch(batchId: string, cattleId: string): boolean {
    const batch = this.getBatch(batchId)
    if (!batch) return false

    if (!batch.cattleIds.includes(cattleId)) {
      return this.updateBatch(batchId, {
        cattleIds: [...batch.cattleIds, cattleId],
      })
    }

    return true
  }

  removeCattleFromBatch(batchId: string, cattleId: string): boolean {
    const batch = this.getBatch(batchId)
    if (!batch) return false

    return this.updateBatch(batchId, {
      cattleIds: batch.cattleIds.filter((id) => id !== cattleId),
    })
  }

  getBatchProfitability(batchId: string) {
    const batch = this.getBatch(batchId)
    if (!batch) return null

    // This will integrate with cost calculator to get actual costs
    // For now, return basic structure
    return {
      batchId,
      totalInvestment: batch.totalInvestment,
      headCount: batch.headCount,
      averageCostPerHead: batch.totalInvestment / batch.headCount,
      // More metrics will be calculated from cost calculator
    }
  }
}

export const batchStore = new BatchStore()
