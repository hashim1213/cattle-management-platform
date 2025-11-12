"use client"

import { useEffect, useState } from "react"
import { firebasePenStore as penStore, type Pen, type Barn } from "@/lib/pen-store-firebase"

export function usePenStore() {
  const [pens, setPens] = useState<Pen[]>([])
  const [barns, setBarns] = useState<Barn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      setLoading(true)
      await penStore.loadBarns()
      await penStore.loadPens()
      setPens(penStore.getPens())
      setBarns(penStore.getBarns())
      setLoading(false)
    }

    loadData()

    // Subscribe to changes
    const unsubscribe = penStore.subscribe(() => {
      setPens(penStore.getPens())
      setBarns(penStore.getBarns())
    })

    return unsubscribe
  }, [])

  return {
    pens,
    barns,
    loading,
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
  }
}
