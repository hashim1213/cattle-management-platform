import { useEffect, useState } from "react"
import { pairsStore, type CattlePair, type WeaningRecord } from "@/lib/pairs-store"

export function usePairsStore() {
  const [pairs, setPairs] = useState<CattlePair[]>([])
  const [weaningRecords, setWeaningRecords] = useState<WeaningRecord[]>([])

  useEffect(() => {
    const updateState = () => {
      setPairs(pairsStore.getPairs())
      setWeaningRecords(pairsStore.getWeaningRecords())
    }

    updateState()
    const unsubscribe = pairsStore.subscribe(updateState)

    return () => unsubscribe()
  }, [])

  return {
    pairs,
    weaningRecords,
    activePairs: pairs.filter((p) => p.status === "active"),
    weanedPairs: pairs.filter((p) => p.status === "weaned"),
    getPair: (id: string) => pairsStore.getPair(id),
    getPairsByDam: (damId: string) => pairsStore.getPairsByDam(damId),
    getPairByCalf: (calfId: string) => pairsStore.getPairByCalf(calfId),
    createPair: (damId: string, calfId: string, pairDate: string, birthWeight?: number, notes?: string) =>
      pairsStore.createPair(damId, calfId, pairDate, birthWeight, notes),
    updatePair: (id: string, updates: Partial<Omit<CattlePair, "id" | "createdAt">>) =>
      pairsStore.updatePair(id, updates),
    deletePair: (id: string) => pairsStore.deletePair(id),
    weanCalf: (pairId: string, weanWeight: number, weanDate: string, notes?: string) =>
      pairsStore.weanCalf(pairId, weanWeight, weanDate, notes),
    getDamStats: (damId: string) => pairsStore.getDamStats(damId),
    getActiveDams: () => pairsStore.getActiveDams(),
  }
}
