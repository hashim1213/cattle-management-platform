"use client"

import { useEffect, useState } from "react"
import { batchStore, type Batch } from "@/lib/batch-store"

export function useBatchStore() {
  const [batches, setBatches] = useState<Batch[]>(batchStore.getBatches())

  useEffect(() => {
    const unsubscribe = batchStore.subscribe(() => {
      setBatches(batchStore.getBatches())
    })

    return unsubscribe
  }, [])

  return {
    batches,
    getBatch: (id: string) => batchStore.getBatch(id),
    addBatch: (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => batchStore.addBatch(batch),
    updateBatch: (id: string, updates: Partial<Omit<Batch, "id" | "createdAt">>) =>
      batchStore.updateBatch(id, updates),
    deleteBatch: (id: string) => batchStore.deleteBatch(id),
    addCattleToBatch: (batchId: string, cattleId: string) =>
      batchStore.addCattleToBatch(batchId, cattleId),
    removeCattleFromBatch: (batchId: string, cattleId: string) =>
      batchStore.removeCattleFromBatch(batchId, cattleId),
    getBatchProfitability: (batchId: string) => batchStore.getBatchProfitability(batchId),
  }
}
