/**
 * Time Tracking Store
 * Log hours spent by staff on specific operations
 */
import { generateUniqueId } from "./id-generator"

export type OperationType =
  | "feeding"
  | "cleaning"
  | "health-check"
  | "treatment"
  | "moving-cattle"
  | "maintenance"
  | "pen-setup"
  | "other"

export interface TimeEntry {
  id: string
  userId: string
  userName: string
  operationType: OperationType
  description: string
  hours: number
  date: string
  relatedEntity?: {
    type: "pen" | "barn" | "cattle" | "pasture"
    id: string
    name: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

const TIME_TRACKING_STORAGE_KEY = "cattle-time-tracking"

class TimeTrackingStore {
  private entries: TimeEntry[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadData()
  }

  private loadData() {
    // Removed localStorage caching for realtime data loading
    this.entries = []
  }

  private save() {
    // Removed localStorage caching for realtime data loading
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getEntries(filters?: {
    userId?: string
    operationType?: OperationType
    dateRange?: { start: string; end: string }
  }): TimeEntry[] {
    let filtered = [...this.entries]

    if (filters?.userId) {
      filtered = filtered.filter((e) => e.userId === filters.userId)
    }

    if (filters?.operationType) {
      filtered = filtered.filter((e) => e.operationType === filters.operationType)
    }

    if (filters?.dateRange) {
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      filtered = filtered.filter((e) => {
        const date = new Date(e.date)
        return date >= start && date <= end
      })
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getEntry(id: string): TimeEntry | undefined {
    return this.entries.find((e) => e.id === id)
  }

  addEntry(entry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">): string {
    const newEntry: TimeEntry = {
      ...entry,
      id: generateUniqueId("time"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.entries.push(newEntry)
    this.save()
    return newEntry.id
  }

  updateEntry(id: string, updates: Partial<Omit<TimeEntry, "id" | "createdAt">>): boolean {
    const index = this.entries.findIndex((e) => e.id === id)
    if (index === -1) return false

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteEntry(id: string): boolean {
    const index = this.entries.findIndex((e) => e.id === id)
    if (index === -1) return false

    this.entries.splice(index, 1)
    this.save()
    return true
  }

  getTotalHoursByUser(userId: string, dateRange?: { start: string; end: string }): number {
    const entries = this.getEntries({ userId, dateRange })
    return entries.reduce((total, entry) => total + entry.hours, 0)
  }

  getTotalHoursByOperation(
    operationType: OperationType,
    dateRange?: { start: string; end: string }
  ): number {
    const entries = this.getEntries({ operationType, dateRange })
    return entries.reduce((total, entry) => total + entry.hours, 0)
  }

  getTimeStats(dateRange?: { start: string; end: string }) {
    const entries = this.getEntries({ dateRange })

    const byUser: Record<string, number> = {}
    const byOperation: Record<OperationType, number> = {} as Record<OperationType, number>

    entries.forEach((entry) => {
      byUser[entry.userId] = (byUser[entry.userId] || 0) + entry.hours
      byOperation[entry.operationType] =
        (byOperation[entry.operationType] || 0) + entry.hours
    })

    return {
      totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      byUser,
      byOperation,
      entryCount: entries.length,
    }
  }
}

export const timeTrackingStore = new TimeTrackingStore()
