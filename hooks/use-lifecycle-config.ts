"use client"

import { useEffect, useState } from "react"
import { firebaseLifecycleConfig, type LifecycleStage } from "@/lib/lifecycle-config-firebase"

export function useLifecycleConfig() {
  const [stages, setStages] = useState<LifecycleStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load stages on mount
    const loadStages = async () => {
      await firebaseLifecycleConfig.loadStages()
      setStages(firebaseLifecycleConfig.getStages())
      setLoading(false)
    }

    loadStages()

    // Subscribe to changes
    const unsubscribe = firebaseLifecycleConfig.subscribe(() => {
      setStages(firebaseLifecycleConfig.getStages())
    })

    return unsubscribe
  }, [])

  return {
    stages,
    loading,
    stageNames: stages.map((s) => s.name),
    getStageById: (id: string) => firebaseLifecycleConfig.getStageById(id),
    getStageByName: (name: string) => firebaseLifecycleConfig.getStageByName(name),
    addStage: (stage: Omit<LifecycleStage, "id" | "order" | "createdAt" | "updatedAt">) =>
      firebaseLifecycleConfig.addStage(stage),
    updateStage: (id: string, updates: Partial<Omit<LifecycleStage, "id" | "createdAt">>) =>
      firebaseLifecycleConfig.updateStage(id, updates),
    removeStage: (id: string) => firebaseLifecycleConfig.removeStage(id),
    reorderStages: (stageIds: string[]) => firebaseLifecycleConfig.reorderStages(stageIds),
    resetToDefault: () => firebaseLifecycleConfig.resetToDefault(),
  }
}
