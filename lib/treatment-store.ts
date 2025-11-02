// Treatment and Health Management System

export type TreatmentType =
  | "vaccination"
  | "dewormer"
  | "lice-treatment"
  | "antibiotic"
  | "vitamin"
  | "pain-relief"
  | "foot-care"
  | "other"

export type ApplicationMethod =
  | "injection"
  | "oral"
  | "topical"
  | "pour-on"
  | "bolus"
  | "other"

// Individual treatment record
export interface Treatment {
  id: string
  cattleId?: string // Individual treatment
  penId?: string // Bulk treatment to entire pen
  barnId?: string
  treatmentType: TreatmentType
  productName: string
  manufacturer?: string
  lotNumber?: string
  dosage: string
  dosageUnit: string
  applicationMethod: ApplicationMethod
  administeredBy: string
  date: string
  cost: number
  costPerHead?: number
  headCount?: number // For bulk treatments
  reason: string
  notes?: string
  withdrawalPeriodDays?: number
  withdrawalDate?: string
  nextDueDate?: string
  createdAt: string
}

// Mortality record
export interface MortalityRecord {
  id: string
  cattleId: string
  penId?: string
  barnId?: string
  tagNumber: string
  breed: string
  sex: string
  age: string
  dateOfDeath: string
  causeOfDeath: string
  category: "illness" | "injury" | "calving" | "predator" | "unknown" | "other"
  veterinarianConsulted: boolean
  veterinarianName?: string
  necropsy: boolean
  necropsyFindings?: string
  purchasePrice?: number
  estimatedLoss: number
  reportedBy: string
  notes?: string
  createdAt: string
}

// Product inventory for treatments
export interface TreatmentProduct {
  id: string
  productName: string
  manufacturer: string
  treatmentType: TreatmentType
  quantityOnHand: number
  unit: string
  costPerUnit: number
  expirationDate?: string
  lotNumber?: string
  withdrawalPeriodDays: number
  dosageGuidelines: string
  storageLocation: string
  notes?: string
  createdAt: string
  updatedAt: string
}

class TreatmentStore {
  private static instance: TreatmentStore
  private treatments: Treatment[] = []
  private mortalityRecords: MortalityRecord[] = []
  private products: TreatmentProduct[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): TreatmentStore {
    if (!TreatmentStore.instance) {
      TreatmentStore.instance = new TreatmentStore()
    }
    return TreatmentStore.instance
  }

  private load() {
    if (typeof window === "undefined") return

    const treatmentsData = localStorage.getItem("treatments")
    if (treatmentsData) {
      this.treatments = JSON.parse(treatmentsData)
    }

    const mortalityData = localStorage.getItem("mortalityRecords")
    if (mortalityData) {
      this.mortalityRecords = JSON.parse(mortalityData)
    }

    const productsData = localStorage.getItem("treatmentProducts")
    if (productsData) {
      this.products = JSON.parse(productsData)
    } else {
      // Initialize with sample products
      this.products = [
        {
          id: "tp-1",
          productName: "Ivermectin Pour-On",
          manufacturer: "Boehringer Ingelheim",
          treatmentType: "dewormer",
          quantityOnHand: 10,
          unit: "liter",
          costPerUnit: 45.00,
          expirationDate: "2026-06-30",
          withdrawalPeriodDays: 35,
          dosageGuidelines: "1 mL per 22 lbs body weight",
          storageLocation: "Medicine Cabinet A",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "tp-2",
          productName: "CyLence Pour-On",
          manufacturer: "Bayer",
          treatmentType: "lice-treatment",
          quantityOnHand: 8,
          unit: "liter",
          costPerUnit: 52.00,
          expirationDate: "2026-08-15",
          withdrawalPeriodDays: 0,
          dosageGuidelines: "1 mL per 10 lbs body weight",
          storageLocation: "Medicine Cabinet A",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "tp-3",
          productName: "Draxxin Injectable",
          manufacturer: "Zoetis",
          treatmentType: "antibiotic",
          quantityOnHand: 5,
          unit: "100mL bottle",
          costPerUnit: 125.00,
          expirationDate: "2025-12-31",
          withdrawalPeriodDays: 18,
          dosageGuidelines: "1.1 mL per 110 lbs body weight",
          storageLocation: "Refrigerator",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      this.save()
    }
  }

  private save() {
    if (typeof window === "undefined") return
    localStorage.setItem("treatments", JSON.stringify(this.treatments))
    localStorage.setItem("mortalityRecords", JSON.stringify(this.mortalityRecords))
    localStorage.setItem("treatmentProducts", JSON.stringify(this.products))
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  // Treatment operations
  addTreatment(treatment: Omit<Treatment, "id" | "createdAt">): Treatment {
    const newTreatment: Treatment = {
      ...treatment,
      id: `treatment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    this.treatments.unshift(newTreatment)

    // Limit to 5000 treatments
    if (this.treatments.length > 5000) {
      this.treatments = this.treatments.slice(0, 5000)
    }

    this.save()
    return newTreatment
  }

  getTreatments(): Treatment[] {
    return this.treatments
  }

  getCattleTreatments(cattleId: string): Treatment[] {
    return this.treatments.filter((t) => t.cattleId === cattleId)
  }

  getPenTreatments(penId: string): Treatment[] {
    return this.treatments.filter((t) => t.penId === penId)
  }

  getBarnTreatments(barnId: string): Treatment[] {
    return this.treatments.filter((t) => t.barnId === barnId)
  }

  getTreatmentById(id: string): Treatment | undefined {
    return this.treatments.find((t) => t.id === id)
  }

  // Get upcoming withdrawal dates
  getActiveWithdrawals(): Treatment[] {
    const now = new Date()
    return this.treatments
      .filter((t) => t.withdrawalDate && new Date(t.withdrawalDate) > now)
      .sort((a, b) => new Date(a.withdrawalDate!).getTime() - new Date(b.withdrawalDate!).getTime())
  }

  // Mortality operations
  addMortalityRecord(record: Omit<MortalityRecord, "id" | "createdAt">): MortalityRecord {
    const newRecord: MortalityRecord = {
      ...record,
      id: `mortality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    this.mortalityRecords.unshift(newRecord)

    // Limit to 1000 records
    if (this.mortalityRecords.length > 1000) {
      this.mortalityRecords = this.mortalityRecords.slice(0, 1000)
    }

    this.save()
    return newRecord
  }

  getMortalityRecords(): MortalityRecord[] {
    return this.mortalityRecords
  }

  getPenMortalityRecords(penId: string): MortalityRecord[] {
    return this.mortalityRecords.filter((m) => m.penId === penId)
  }

  getBarnMortalityRecords(barnId: string): MortalityRecord[] {
    return this.mortalityRecords.filter((m) => m.barnId === barnId)
  }

  // Get mortality stats
  getMortalityStats(dateRange?: { start: string; end: string }) {
    let records = this.mortalityRecords

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      records = records.filter((r) => {
        const date = new Date(r.dateOfDeath)
        return date >= start && date <= end
      })
    }

    const totalLoss = records.reduce((sum, r) => sum + r.estimatedLoss, 0)
    const byCategory = records.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalDeaths: records.length,
      totalLoss,
      byCategory,
      mortalityRate: 0, // Would need total herd size to calculate
    }
  }

  // Product operations
  addProduct(product: Omit<TreatmentProduct, "id" | "createdAt" | "updatedAt">): TreatmentProduct {
    const newProduct: TreatmentProduct = {
      ...product,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.products.push(newProduct)
    this.save()
    return newProduct
  }

  updateProduct(id: string, updates: Partial<TreatmentProduct>): TreatmentProduct | null {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return null

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.save()
    return this.products[index]
  }

  getProducts(): TreatmentProduct[] {
    return this.products
  }

  getProductById(id: string): TreatmentProduct | undefined {
    return this.products.find((p) => p.id === id)
  }

  // Get low stock products
  getLowStockProducts(threshold: number = 3): TreatmentProduct[] {
    return this.products.filter((p) => p.quantityOnHand <= threshold)
  }

  // Get expired or expiring soon products
  getExpiringProducts(daysThreshold: number = 30): TreatmentProduct[] {
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + daysThreshold)

    return this.products.filter((p) => {
      if (!p.expirationDate) return false
      const expDate = new Date(p.expirationDate)
      return expDate <= threshold
    })
  }

  // Get total treatment costs
  getTreatmentCosts(dateRange?: { start: string; end: string }): number {
    let treatments = this.treatments

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      treatments = treatments.filter((t) => {
        const date = new Date(t.date)
        return date >= start && date <= end
      })
    }

    return treatments.reduce((sum, t) => sum + t.cost, 0)
  }

  // Get treatment costs for specific pen
  getPenTreatmentCosts(penId: string, dateRange?: { start: string; end: string }): number {
    let treatments = this.treatments.filter((t) => t.penId === penId || t.cattleId)

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      treatments = treatments.filter((t) => {
        const date = new Date(t.date)
        return date >= start && date <= end
      })
    }

    return treatments.reduce((sum, t) => sum + t.cost, 0)
  }
}

export const treatmentStore = TreatmentStore.getInstance()
