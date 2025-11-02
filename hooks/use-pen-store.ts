"use client"

import { useEffect, useState } from "react"
import { penStore, type Pen, type Barn } from "@/lib/pen-store"

export function usePenStore() {
  const [pens, setPens] = useState<Pen[]>(penStore.getPens())
  const [barns, setBarns] = useState<Barn[]>(penStore.getBarns())

  useEffect(() => {
    const unsubscribe = penStore.subscribe(() => {
      setPens(penStore.getPens())
      setBarns(penStore.getBarns())
    })

    return unsubscribe
  }, [])

  return {
    pens,
    barns,
    getPens: (barnId?: string) => penStore.getPens(barnId),
    getPen: (id: string) => penStore.getPen(id),
    getBarn: (id: string) => penStore.getBarn(id),
    addPen: (pen: Omit<Pen, "id" | "createdAt" | "updatedAt" | "currentCount">) => penStore.addPen(pen),
    updatePen: (id: string, updates: Partial<Omit<Pen, "id" | "createdAt">>) =>
      penStore.updatePen(id, updates),
    deletePen: (id: string) => penStore.deletePen(id),
    addBarn: (barn: Omit<Barn, "id" | "createdAt" | "updatedAt">) => penStore.addBarn(barn),
    updateBarn: (id: string, updates: Partial<Omit<Barn, "id" | "createdAt">>) =>
      penStore.updateBarn(id, updates),
    deleteBarn: (id: string) => penStore.deleteBarn(id),
    updatePenCount: (penId: string, delta: number) => penStore.updatePenCount(penId, delta),
    getPenAnalytics: (barnId?: string) => penStore.getPenAnalytics(barnId),
    resetToDefault: () => penStore.resetToDefault(),
  }
}
