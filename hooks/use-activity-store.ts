import { useState, useEffect } from "react"
import { activityStore, type Activity, type ActivityType, type EntityType } from "@/lib/activity-store"

export function useActivityStore() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const updateActivities = () => {
      setActivities(activityStore.getActivities())
    }

    updateActivities()
    return activityStore.subscribe(updateActivities)
  }, [])

  return {
    activities,
    log: activityStore.log.bind(activityStore),
    getActivities: (filters?: {
      entityType?: EntityType
      entityId?: string
      type?: ActivityType
      performedBy?: string
      dateRange?: { start: string; end: string }
      limit?: number
    }) => activityStore.getActivities(filters),
    getEntityActivities: (entityType: EntityType, entityId: string, limit?: number) =>
      activityStore.getEntityActivities(entityType, entityId, limit),
    getTodayActivities: () => activityStore.getTodayActivities(),
    getStats: (dateRange?: { start: string; end: string }) => activityStore.getStats(dateRange),
    clearOldActivities: activityStore.clearOldActivities.bind(activityStore),
    clearAll: activityStore.clearAll.bind(activityStore),
  }
}
