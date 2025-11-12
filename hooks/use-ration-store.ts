import { useEffect, useState } from "react"
import { rationStore, type Ration, type PenRationAssignment, type RationSchedule } from "@/lib/ration-store"

export function useRationStore() {
  const [rations, setRations] = useState<Ration[]>([])
  const [assignments, setAssignments] = useState<PenRationAssignment[]>([])
  const [schedules, setSchedules] = useState<RationSchedule[]>([])

  useEffect(() => {
    const updateState = () => {
      setRations(rationStore.getRations())
      setAssignments(rationStore.getAssignments())
      setSchedules(rationStore.getSchedules())
    }

    updateState()
    const unsubscribe = rationStore.subscribe(updateState)

    return () => unsubscribe()
  }, [])

  return {
    rations,
    assignments,
    schedules,
    activeRations: rations.filter((r) => r.isActive),
    activeAssignments: assignments.filter((a) => a.status === "active"),
    pendingSchedules: schedules.filter((s) => s.status === "pending"),
    getRation: (id: string) => rationStore.getRation(id),
    addRation: (ration: Omit<Ration, "id" | "createdAt" | "updatedAt">) => rationStore.addRation(ration),
    updateRation: (id: string, updates: Partial<Omit<Ration, "id" | "createdAt">>) =>
      rationStore.updateRation(id, updates),
    deleteRation: (id: string) => rationStore.deleteRation(id),
    duplicateRation: (id: string) => rationStore.duplicateRation(id),
    getPenAssignment: (penId: string) => rationStore.getPenAssignment(penId),
    assignRationToPen: (
      penId: string,
      penName: string,
      rationId: string,
      rationName: string,
      headCount: number,
      startDate?: string
    ) => rationStore.assignRationToPen(penId, penName, rationId, rationName, headCount, startDate),
    unassignRationFromPen: (penId: string) => rationStore.unassignRationFromPen(penId),
    scheduleRationChange: (
      penId: string,
      rationId: string,
      triggerDate: string,
      fromRationId?: string,
      notes?: string
    ) => rationStore.scheduleRationChange(penId, rationId, triggerDate, fromRationId, notes),
    cancelSchedule: (id: string) => rationStore.cancelSchedule(id),
    deleteSchedule: (id: string) => rationStore.deleteSchedule(id),
    getRationUsageStats: (rationId: string) => rationStore.getRationUsageStats(rationId),
    exportRationData: (rationId: string) => rationStore.exportRationData(rationId),
    exportAllRations: () => rationStore.exportAllRations(),
  }
}
