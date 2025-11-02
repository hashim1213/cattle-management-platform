"use client"

import { useEffect, useState } from "react"
import { lifecycleConfig, type LifecycleStage } from "@/lib/lifecycle-config"

export function useLifecycleConfig() {
  const [stages, setStages] = useState<LifecycleStage[]>(lifecycleConfig.getStages())

  useEffect(() => {
    const unsubscribe = lifecycleConfig.subscribe(() => {
      setStages(lifecycleConfig.getStages())
    })

    return unsubscribe
  }, [])

  return {
    stages,
    stageNames: stages.map((s) => s.name),
    getStageById: (id: string) => lifecycleConfig.getStageById(id),
    getStageByName: (name: string) => lifecycleConfig.getStageByName(name),
    addStage: (stage: Omit<LifecycleStage, "id" | "order">) => lifecycleConfig.addStage(stage),
    updateStage: (id: string, updates: Partial<Omit<LifecycleStage, "id">>) =>
      lifecycleConfig.updateStage(id, updates),
    removeStage: (id: string) => lifecycleConfig.removeStage(id),
    reorderStages: (stageIds: string[]) => lifecycleConfig.reorderStages(stageIds),
    resetToDefault: () => lifecycleConfig.resetToDefault(),
  }
}
