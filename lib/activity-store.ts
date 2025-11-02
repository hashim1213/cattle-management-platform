/**
 * Activity Log Store
 * Tracks all activities and changes to pens, barns, and cattle
 */

export type ActivityType =
  | "feeding"
  | "cleaning"
  | "maintenance"
  | "health-check"
  | "vet-visit"
  | "cattle-added"
  | "cattle-removed"
  | "cattle-moved"
  | "pen-created"
  | "pen-updated"
  | "pen-deleted"
  | "barn-created"
  | "barn-updated"
  | "barn-deleted"
  | "task-completed"
  | "other"

export type EntityType = "pen" | "barn" | "cattle" | "task" | "general"

export interface Activity {
  id: string
  type: ActivityType
  entityType: EntityType
  entityId?: string // ID of the pen, barn, or cattle
  entityName?: string // Name for display
  title: string
  description?: string
  performedBy: string // User ID or name
  timestamp: string
  changes?: {
    field: string
    oldValue?: string | number
    newValue?: string | number
  }[]
  metadata?: Record<string, any> // Additional data
}

const ACTIVITIES_STORAGE_KEY = "cattle-activities"
const MAX_ACTIVITIES = 1000 // Keep last 1000 activities

class ActivityStore {
  private activities: Activity[] = []
  private listeners = new Set<() => void>()

  constructor() {
    if (typeof window !== "undefined") {
      this.load()
    }
  }

  private load() {
    try {
      const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY)
      this.activities = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load activities:", error)
      this.activities = []
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      // Keep only the most recent activities
      const toSave = this.activities.slice(-MAX_ACTIVITIES)
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(toSave))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save activities:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Log an activity
  log(activity: Omit<Activity, "id" | "timestamp">): Activity {
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    this.activities.push(newActivity)
    this.save()
    return newActivity
  }

  // Get all activities with optional filters
  getActivities(filters?: {
    entityType?: EntityType
    entityId?: string
    type?: ActivityType
    performedBy?: string
    dateRange?: { start: string; end: string }
    limit?: number
  }): Activity[] {
    let filtered = [...this.activities]

    if (filters) {
      if (filters.entityType) {
        filtered = filtered.filter((a) => a.entityType === filters.entityType)
      }
      if (filters.entityId) {
        filtered = filtered.filter((a) => a.entityId === filters.entityId)
      }
      if (filters.type) {
        filtered = filtered.filter((a) => a.type === filters.type)
      }
      if (filters.performedBy) {
        filtered = filtered.filter((a) => a.performedBy === filters.performedBy)
      }
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)
        filtered = filtered.filter((a) => {
          const timestamp = new Date(a.timestamp)
          return timestamp >= start && timestamp <= end
        })
      }
      if (filters.limit) {
        filtered = filtered.slice(-filters.limit)
      }
    }

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Get recent activities for a specific entity
  getEntityActivities(entityType: EntityType, entityId: string, limit = 50): Activity[] {
    return this.getActivities({ entityType, entityId, limit })
  }

  // Get activities for today
  getTodayActivities(): Activity[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.getActivities({
      dateRange: {
        start: today.toISOString(),
        end: tomorrow.toISOString(),
      },
    })
  }

  // Get activities statistics
  getStats(dateRange?: { start: string; end: string }) {
    const activities = dateRange
      ? this.getActivities({ dateRange })
      : this.activities

    const byType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byEntity = activities.reduce((acc, activity) => {
      acc[activity.entityType] = (acc[activity.entityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byUser = activities.reduce((acc, activity) => {
      acc[activity.performedBy] = (acc[activity.performedBy] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: activities.length,
      byType,
      byEntity,
      byUser,
    }
  }

  // Clear old activities
  clearOldActivities(daysToKeep = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    this.activities = this.activities.filter(
      (a) => new Date(a.timestamp) >= cutoffDate
    )

    this.save()
  }

  // Delete all activities (use with caution)
  clearAll() {
    this.activities = []
    this.save()
  }
}

export const activityStore = new ActivityStore()
