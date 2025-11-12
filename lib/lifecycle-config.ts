/**
 * Lifecycle Configuration Store
 * Manages customizable production lifecycle stages
 */

export interface LifecycleStage {
  id: string
  name: string
  order: number
  color: string
  description?: string
  image?: string
}

const DEFAULT_STAGES: LifecycleStage[] = [
  { id: "calf", name: "Calf", order: 1, color: "#3b82f6", description: "Newborn cattle", image: "/images/calf.png" },
  { id: "weaner", name: "Weaned Calf", order: 2, color: "#8b5cf6", description: "Recently weaned", image: "/images/weaning.png" },
  { id: "yearling", name: "Yearling", order: 3, color: "#ec4899", description: "Second year of life", image: "/images/yearling.png" },
  { id: "breeding", name: "Breeding", order: 4, color: "#10b981", description: "Reproduction cycle", image: "/images/breeding.png" },
  { id: "finishing", name: "Finishing", order: 5, color: "#f59e0b", description: "Prepared for market", image: "/images/cow.png" },
]

const STORAGE_KEY = "cattle-lifecycle-stages"

class LifecycleConfigStore {
  private stages: LifecycleStage[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadStages()
  }

  private loadStages() {
    if (typeof window === "undefined") {
      this.stages = DEFAULT_STAGES
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.stages = JSON.parse(stored)
      } else {
        this.stages = DEFAULT_STAGES
        this.saveStages()
      }
    } catch (error) {
      console.error("Failed to load lifecycle stages:", error)
      this.stages = DEFAULT_STAGES
    }
  }

  private saveStages() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stages))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save lifecycle stages:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStages(): LifecycleStage[] {
    return [...this.stages].sort((a, b) => a.order - b.order)
  }

  getStageNames(): string[] {
    return this.getStages().map((s) => s.name)
  }

  getStageById(id: string): LifecycleStage | undefined {
    return this.stages.find((s) => s.id === id)
  }

  getStageByName(name: string): LifecycleStage | undefined {
    return this.stages.find((s) => s.name.toLowerCase() === name.toLowerCase())
  }

  addStage(stage: Omit<LifecycleStage, "id" | "order">): LifecycleStage {
    const newStage: LifecycleStage = {
      ...stage,
      id: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: this.stages.length + 1,
    }

    this.stages.push(newStage)
    this.saveStages()
    return newStage
  }

  updateStage(id: string, updates: Partial<Omit<LifecycleStage, "id">>): boolean {
    const index = this.stages.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.stages[index] = { ...this.stages[index], ...updates }
    this.saveStages()
    return true
  }

  removeStage(id: string): boolean {
    const index = this.stages.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.stages.splice(index, 1)
    // Reorder remaining stages
    this.stages.forEach((stage, idx) => {
      stage.order = idx + 1
    })
    this.saveStages()
    return true
  }

  reorderStages(stageIds: string[]) {
    const reordered = stageIds
      .map((id) => this.stages.find((s) => s.id === id))
      .filter((s): s is LifecycleStage => s !== undefined)

    if (reordered.length !== this.stages.length) {
      console.error("Invalid reorder operation")
      return
    }

    reordered.forEach((stage, index) => {
      stage.order = index + 1
    })

    this.stages = reordered
    this.saveStages()
  }

  resetToDefault() {
    this.stages = DEFAULT_STAGES
    this.saveStages()
  }
}

export const lifecycleConfig = new LifecycleConfigStore()
