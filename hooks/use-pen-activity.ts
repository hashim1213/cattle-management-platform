import { useState, useEffect, useMemo, useCallback } from "react"
import { penActivityStore, type PenFeedActivity, type PenMedicationActivity } from "@/lib/pen-activity-store"

export function usePenActivity() {
  const [feedActivities, setFeedActivities] = useState<PenFeedActivity[]>([])
  const [medicationActivities, setMedicationActivities] = useState<PenMedicationActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await penActivityStore.loadFeedActivities()
        await penActivityStore.loadMedicationActivities()
        // Initial load
        setFeedActivities(penActivityStore.getAllFeedActivities())
        setMedicationActivities(penActivityStore.getAllMedicationActivities())
      } catch (error) {
        console.error("Error loading pen activities:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe to changes
    const unsubscribe = penActivityStore.subscribe(() => {
      setFeedActivities(penActivityStore.getAllFeedActivities())
      setMedicationActivities(penActivityStore.getAllMedicationActivities())
    })

    return () => unsubscribe()
  }, [])

  // Memoize functions to prevent re-renders
  const addFeedActivity = useCallback(
    (activity: Omit<PenFeedActivity, "id" | "createdAt">) =>
      penActivityStore.addFeedActivity(activity),
    []
  )

  const deleteFeedActivity = useCallback(
    (id: string) => penActivityStore.deleteFeedActivity(id),
    []
  )

  const addMedicationActivity = useCallback(
    (activity: Omit<PenMedicationActivity, "id" | "createdAt">) =>
      penActivityStore.addMedicationActivity(activity),
    []
  )

  const deleteMedicationActivity = useCallback(
    (id: string) => penActivityStore.deleteMedicationActivity(id),
    []
  )

  const getFeedActivitiesByPen = useCallback(
    (penId: string) => penActivityStore.getFeedActivitiesByPen(penId),
    []
  )

  const getMedicationActivitiesByPen = useCallback(
    (penId: string) => penActivityStore.getMedicationActivitiesByPen(penId),
    []
  )

  const getTotalFeedCostByPen = useCallback(
    (penId: string) => penActivityStore.getTotalFeedCostByPen(penId),
    []
  )

  const getTotalMedicationCostByPen = useCallback(
    (penId: string) => penActivityStore.getTotalMedicationCostByPen(penId),
    []
  )

  const getPenROI = useCallback(
    (penId: string, cattleValue: number) => penActivityStore.getPenROI(penId, cattleValue),
    []
  )

  return {
    feedActivities,
    medicationActivities,
    loading,
    addFeedActivity,
    deleteFeedActivity,
    addMedicationActivity,
    deleteMedicationActivity,
    getFeedActivitiesByPen,
    getMedicationActivitiesByPen,
    getTotalFeedCostByPen,
    getTotalMedicationCostByPen,
    getPenROI,
  }
}
