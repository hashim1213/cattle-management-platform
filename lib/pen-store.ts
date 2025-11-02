/**
 * Pen Management Store
 * Handles barn/pen hierarchy and cattle assignments
 */

export interface Pen {
  id: string
  name: string
  barnId: string
  capacity: number
  currentCount: number
  location?: {
    x: number
    y: number
    width: number
    height: number
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Barn {
  id: string
  name: string
  location: string
  totalPens: number
  totalCapacity: number
  notes?: string
  createdAt: string
  updatedAt: string
}

const PENS_STORAGE_KEY = "cattle-pens"
const BARNS_STORAGE_KEY = "cattle-barns"

// Default barns
const DEFAULT_BARNS: Barn[] = [
  {
    id: "barn-1",
    name: "Main Barn",
    location: "North Field",
    totalPens: 4,
    totalCapacity: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "barn-2",
    name: "South Barn",
    location: "South Field",
    totalPens: 3,
    totalCapacity: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Default pens
const DEFAULT_PENS: Pen[] = [
  {
    id: "pen-1",
    name: "Pen A",
    barnId: "barn-1",
    capacity: 30,
    currentCount: 0,
    location: { x: 50, y: 50, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-2",
    name: "Pen B",
    barnId: "barn-1",
    capacity: 30,
    currentCount: 0,
    location: { x: 220, y: 50, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-3",
    name: "Pen C",
    barnId: "barn-1",
    capacity: 30,
    currentCount: 0,
    location: { x: 50, y: 170, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-4",
    name: "Pen D",
    barnId: "barn-1",
    capacity: 30,
    currentCount: 0,
    location: { x: 220, y: 170, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-5",
    name: "Pen E",
    barnId: "barn-2",
    capacity: 30,
    currentCount: 0,
    location: { x: 50, y: 50, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-6",
    name: "Pen F",
    barnId: "barn-2",
    capacity: 30,
    currentCount: 0,
    location: { x: 220, y: 50, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pen-7",
    name: "Pen G",
    barnId: "barn-2",
    capacity: 30,
    currentCount: 0,
    location: { x: 135, y: 170, width: 150, height: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

class PenStore {
  private pens: Pen[] = []
  private barns: Barn[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadData()
  }

  private loadData() {
    if (typeof window === "undefined") {
      this.pens = DEFAULT_PENS
      this.barns = DEFAULT_BARNS
      return
    }

    try {
      const storedPens = localStorage.getItem(PENS_STORAGE_KEY)
      const storedBarns = localStorage.getItem(BARNS_STORAGE_KEY)

      this.pens = storedPens ? JSON.parse(storedPens) : DEFAULT_PENS
      this.barns = storedBarns ? JSON.parse(storedBarns) : DEFAULT_BARNS

      if (!storedPens) this.save()
      if (!storedBarns) this.save()
    } catch (error) {
      console.error("Failed to load pen/barn data:", error)
      this.pens = DEFAULT_PENS
      this.barns = DEFAULT_BARNS
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(PENS_STORAGE_KEY, JSON.stringify(this.pens))
      localStorage.setItem(BARNS_STORAGE_KEY, JSON.stringify(this.barns))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save pen/barn data:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Barn operations
  getBarns(): Barn[] {
    return [...this.barns]
  }

  getBarn(id: string): Barn | undefined {
    return this.barns.find((b) => b.id === id)
  }

  addBarn(barn: Omit<Barn, "id" | "createdAt" | "updatedAt">): Barn {
    const newBarn: Barn = {
      ...barn,
      id: `barn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.barns.push(newBarn)
    this.save()
    return newBarn
  }

  updateBarn(id: string, updates: Partial<Omit<Barn, "id" | "createdAt">>): boolean {
    const index = this.barns.findIndex((b) => b.id === id)
    if (index === -1) return false

    this.barns[index] = {
      ...this.barns[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteBarn(id: string): boolean {
    const hasPens = this.pens.some((p) => p.barnId === id)
    if (hasPens) {
      throw new Error("Cannot delete barn with pens. Delete pens first.")
    }

    const index = this.barns.findIndex((b) => b.id === id)
    if (index === -1) return false

    this.barns.splice(index, 1)
    this.save()
    return true
  }

  // Pen operations
  getPens(barnId?: string): Pen[] {
    if (barnId) {
      return this.pens.filter((p) => p.barnId === barnId)
    }
    return [...this.pens]
  }

  getPen(id: string): Pen | undefined {
    return this.pens.find((p) => p.id === id)
  }

  addPen(pen: Omit<Pen, "id" | "createdAt" | "updatedAt" | "currentCount">): Pen {
    const newPen: Pen = {
      ...pen,
      id: `pen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.pens.push(newPen)
    this.save()
    return newPen
  }

  updatePen(id: string, updates: Partial<Omit<Pen, "id" | "createdAt">>): boolean {
    const index = this.pens.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.pens[index] = {
      ...this.pens[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deletePen(id: string): boolean {
    const pen = this.getPen(id)
    if (pen && pen.currentCount > 0) {
      throw new Error("Cannot delete pen with cattle. Move cattle first.")
    }

    const index = this.pens.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.pens.splice(index, 1)
    this.save()
    return true
  }

  updatePenCount(penId: string, delta: number): boolean {
    const pen = this.getPen(penId)
    if (!pen) return false

    const newCount = pen.currentCount + delta
    if (newCount < 0 || newCount > pen.capacity) return false

    return this.updatePen(penId, { currentCount: newCount })
  }

  // Analytics
  getPenAnalytics(barnId?: string) {
    const pens = barnId ? this.getPens(barnId) : this.getPens()

    const totalCapacity = pens.reduce((sum, p) => sum + p.capacity, 0)
    const totalOccupied = pens.reduce((sum, p) => sum + p.currentCount, 0)
    const utilizationRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0

    const penStats = pens.map((pen) => ({
      ...pen,
      utilizationRate: pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0,
      available: pen.capacity - pen.currentCount,
    }))

    return {
      totalPens: pens.length,
      totalCapacity,
      totalOccupied,
      totalAvailable: totalCapacity - totalOccupied,
      utilizationRate,
      pens: penStats,
    }
  }

  resetToDefault() {
    this.pens = DEFAULT_PENS
    this.barns = DEFAULT_BARNS
    this.save()
  }
}

export const penStore = new PenStore()
