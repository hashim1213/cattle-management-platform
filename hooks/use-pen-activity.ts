import { useState, useEffect } from "react"
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

  return {
    feedActivities,
    medicationActivities,
    loading,
    addFeedActivity: penActivityStore.addFeedActivity.bind(penActivityStore),
    deleteFeedActivity: penActivityStore.deleteFeedActivity.bind(penActivityStore),
    addMedicationActivity: penActivityStore.addMedicationActivity.bind(penActivityStore),
    deleteMedicationActivity: penActivityStore.deleteMedicationActivity.bind(penActivityStore),
    getFeedActivitiesByPen: penActivityStore.getFeedActivitiesByPen.bind(penActivityStore),
    getMedicationActivitiesByPen: penActivityStore.getMedicationActivitiesByPen.bind(penActivityStore),
    getTotalFeedCostByPen: penActivityStore.getTotalFeedCostByPen.bind(penActivityStore),
    getTotalMedicationCostByPen: penActivityStore.getTotalMedicationCostByPen.bind(penActivityStore),
    getPenROI: penActivityStore.getPenROI.bind(penActivityStore),
  }
}
