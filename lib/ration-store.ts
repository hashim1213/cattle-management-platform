/**
 * Feed Ration Management Store
 * Manages feed rations, ingredients, pen assignments, and scheduled changes
 */

import { generateUniqueId } from "./id-generator"

export interface RationIngredient {
  id: string
  feedId: string // Links to feed inventory
  feedName: string
  amountLbs: number // Amount in pounds per head per day
  percentage: number // Percentage of total ration
  costPerLb: number
}

export interface RationKPI {
  targetADG: number // Target Average Daily Gain (lbs/day)
  targetFeedConversion: number // Feed:Gain ratio
  crudeProtein: number // % CP
  totalDigestibleNutrients: number // % TDN
  netEnergyMaintenance: number // Mcal/lb
  netEnergyGain: number // Mcal/lb
  costPerHead: number // $/head/day
  costPerPound: number // $/lb of gain
}

export interface Ration {
  id: string
  name: string
  description?: string
  stage: "receiving" | "growing" | "finishing" | "maintenance" | "custom"
  ingredients: RationIngredient[]
  totalLbsPerHead: number // Total lbs per head per day
  kpis: RationKPI
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  isActive: boolean
}

export interface PenRationAssignment {
  id: string
  penId: string
  penName: string
  rationId: string
  rationName: string
  assignedDate: string
  startDate: string // When feeding actually starts
  endDate?: string // When assignment ended (null if current)
  headCount: number // Number of cattle when assigned
  status: "scheduled" | "active" | "completed"
}

export interface RationSchedule {
  id: string
  penId: string
  rationId: string
  triggerDate: string // Date to automatically switch rations
  fromRationId?: string // Previous ration (optional)
  notes?: string
  status: "pending" | "executed" | "cancelled"
  createdAt: string
  executedAt?: string
}

const RATIONS_STORAGE_KEY = "cattle-rations"
const ASSIGNMENTS_STORAGE_KEY = "cattle-ration-assignments"
const SCHEDULES_STORAGE_KEY = "cattle-ration-schedules"

class RationStore {
  private rations: Ration[] = []
  private assignments: PenRationAssignment[] = []
  private schedules: RationSchedule[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadData()
    this.checkSchedules() // Check for any pending scheduled changes
  }

  private loadData() {
    if (typeof window === "undefined") return

    try {
      const rationsStored = localStorage.getItem(RATIONS_STORAGE_KEY)
      const assignmentsStored = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)
      const schedulesStored = localStorage.getItem(SCHEDULES_STORAGE_KEY)

      this.rations = rationsStored ? JSON.parse(rationsStored) : []
      this.assignments = assignmentsStored ? JSON.parse(assignmentsStored) : []
      this.schedules = schedulesStored ? JSON.parse(schedulesStored) : []
    } catch (error) {
      console.error("Failed to load ration data:", error)
      this.rations = []
      this.assignments = []
      this.schedules = []
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(RATIONS_STORAGE_KEY, JSON.stringify(this.rations))
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(this.assignments))
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(this.schedules))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save ration data:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Ration CRUD Operations
  getRations(): Ration[] {
    return [...this.rations]
  }

  getActiveRations(): Ration[] {
    return this.rations.filter((r) => r.isActive)
  }

  getRation(id: string): Ration | undefined {
    return this.rations.find((r) => r.id === id)
  }

  addRation(ration: Omit<Ration, "id" | "createdAt" | "updatedAt">): Ration {
    const newRation: Ration = {
      ...ration,
      id: generateUniqueId("ration"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.rations.push(newRation)
    this.save()
    return newRation
  }

  updateRation(id: string, updates: Partial<Omit<Ration, "id" | "createdAt">>): boolean {
    const index = this.rations.findIndex((r) => r.id === id)
    if (index === -1) return false

    this.rations[index] = {
      ...this.rations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteRation(id: string): boolean {
    // Check if ration is currently assigned
    const hasActiveAssignments = this.assignments.some(
      (a) => a.rationId === id && a.status === "active"
    )

    if (hasActiveAssignments) {
      throw new Error("Cannot delete ration with active pen assignments")
    }

    const index = this.rations.findIndex((r) => r.id === id)
    if (index === -1) return false

    this.rations.splice(index, 1)
    this.save()
    return true
  }

  duplicateRation(id: string): Ration | null {
    const original = this.getRation(id)
    if (!original) return null

    const duplicate: Omit<Ration, "id" | "createdAt" | "updatedAt"> = {
      ...original,
      name: `${original.name} (Copy)`,
    }

    return this.addRation(duplicate)
  }

  // Pen Assignment Operations
  getAssignments(): PenRationAssignment[] {
    return [...this.assignments]
  }

  getPenAssignment(penId: string): PenRationAssignment | undefined {
    return this.assignments.find((a) => a.penId === penId && a.status === "active")
  }

  getActiveAssignments(): PenRationAssignment[] {
    return this.assignments.filter((a) => a.status === "active")
  }

  getRationAssignments(rationId: string): PenRationAssignment[] {
    return this.assignments.filter((a) => a.rationId === rationId)
  }

  assignRationToPen(
    penId: string,
    penName: string,
    rationId: string,
    rationName: string,
    headCount: number,
    startDate?: string
  ): PenRationAssignment {
    // End any existing active assignment for this pen
    const existingAssignment = this.getPenAssignment(penId)
    if (existingAssignment) {
      this.updateAssignment(existingAssignment.id, {
        status: "completed",
        endDate: new Date().toISOString(),
      })
    }

    const assignment: PenRationAssignment = {
      id: generateUniqueId("ration-assignment"),
      penId,
      penName,
      rationId,
      rationName,
      assignedDate: new Date().toISOString(),
      startDate: startDate || new Date().toISOString(),
      headCount,
      status: startDate && new Date(startDate) > new Date() ? "scheduled" : "active",
    }

    this.assignments.push(assignment)
    this.save()
    return assignment
  }

  updateAssignment(
    id: string,
    updates: Partial<Omit<PenRationAssignment, "id" | "assignedDate">>
  ): boolean {
    const index = this.assignments.findIndex((a) => a.id === id)
    if (index === -1) return false

    this.assignments[index] = {
      ...this.assignments[index],
      ...updates,
    }

    this.save()
    return true
  }

  unassignRationFromPen(penId: string): boolean {
    const assignment = this.getPenAssignment(penId)
    if (!assignment) return false

    return this.updateAssignment(assignment.id, {
      status: "completed",
      endDate: new Date().toISOString(),
    })
  }

  // Schedule Operations
  getSchedules(): RationSchedule[] {
    return [...this.schedules]
  }

  getPendingSchedules(): RationSchedule[] {
    return this.schedules.filter((s) => s.status === "pending")
  }

  getPenSchedule(penId: string): RationSchedule | undefined {
    return this.schedules.find((s) => s.penId === penId && s.status === "pending")
  }

  scheduleRationChange(
    penId: string,
    rationId: string,
    triggerDate: string,
    fromRationId?: string,
    notes?: string
  ): RationSchedule {
    const schedule: RationSchedule = {
      id: generateUniqueId("ration-schedule"),
      penId,
      rationId,
      triggerDate,
      fromRationId,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    this.schedules.push(schedule)
    this.save()
    return schedule
  }

  updateSchedule(
    id: string,
    updates: Partial<Omit<RationSchedule, "id" | "createdAt">>
  ): boolean {
    const index = this.schedules.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
    }

    this.save()
    return true
  }

  cancelSchedule(id: string): boolean {
    return this.updateSchedule(id, { status: "cancelled" })
  }

  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.schedules.splice(index, 1)
    this.save()
    return true
  }

  // Check and execute pending schedules
  checkSchedules() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingSchedules = this.getPendingSchedules()

    pendingSchedules.forEach((schedule) => {
      const triggerDate = new Date(schedule.triggerDate)
      triggerDate.setHours(0, 0, 0, 0)

      if (triggerDate <= today) {
        // Execute the scheduled change
        const ration = this.getRation(schedule.rationId)
        if (ration) {
          // Get current pen assignment to get head count
          const currentAssignment = this.getPenAssignment(schedule.penId)
          const headCount = currentAssignment?.headCount || 0

          // Assign new ration
          this.assignRationToPen(
            schedule.penId,
            currentAssignment?.penName || "",
            schedule.rationId,
            ration.name,
            headCount,
            schedule.triggerDate
          )

          // Mark schedule as executed
          this.updateSchedule(schedule.id, {
            status: "executed",
            executedAt: new Date().toISOString(),
          })
        }
      }
    })
  }

  // Analytics and Reporting
  getRationUsageStats(rationId: string) {
    const assignments = this.getRationAssignments(rationId)
    const activeAssignments = assignments.filter((a) => a.status === "active")

    const totalHeadCount = activeAssignments.reduce((sum, a) => sum + a.headCount, 0)
    const pensUsing = activeAssignments.length

    return {
      rationId,
      totalHeadCount,
      pensUsing,
      activeAssignments,
      historicalAssignments: assignments.filter((a) => a.status === "completed"),
    }
  }

  // Export functionality for nutritionists
  exportRationData(rationId: string) {
    const ration = this.getRation(rationId)
    if (!ration) return null

    const assignments = this.getRationAssignments(rationId)
    const stats = this.getRationUsageStats(rationId)

    return {
      ration,
      assignments,
      stats,
      exportedAt: new Date().toISOString(),
    }
  }

  exportAllRations() {
    return {
      rations: this.rations,
      assignments: this.assignments,
      schedules: this.schedules,
      exportedAt: new Date().toISOString(),
    }
  }
}

export const rationStore = new RationStore()
