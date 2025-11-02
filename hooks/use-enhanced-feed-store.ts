"use client"

import { useEffect, useState } from "react"
import {
  enhancedFeedStore,
  type FeedInventoryItem,
  type FeedAllocation,
  type FeedMixerBatch,
} from "@/lib/enhanced-feed-store"

export function useEnhancedFeedStore() {
  const [inventory, setInventory] = useState<FeedInventoryItem[]>(enhancedFeedStore.getInventory())
  const [allocations, setAllocations] = useState<FeedAllocation[]>(enhancedFeedStore.getAllocations())
  const [mixerBatches, setMixerBatches] = useState<FeedMixerBatch[]>(enhancedFeedStore.getMixerBatches())

  useEffect(() => {
    const unsubscribe = enhancedFeedStore.subscribe(() => {
      setInventory(enhancedFeedStore.getInventory())
      setAllocations(enhancedFeedStore.getAllocations())
      setMixerBatches(enhancedFeedStore.getMixerBatches())
    })

    return unsubscribe
  }, [])

  return {
    // Inventory
    inventory,
    addInventoryItem: enhancedFeedStore.addInventoryItem.bind(enhancedFeedStore),
    updateInventoryItem: enhancedFeedStore.updateInventoryItem.bind(enhancedFeedStore),
    adjustInventoryQuantity: enhancedFeedStore.adjustInventoryQuantity.bind(enhancedFeedStore),
    getInventoryItem: enhancedFeedStore.getInventoryItem.bind(enhancedFeedStore),
    getLowInventoryItems: enhancedFeedStore.getLowInventoryItems.bind(enhancedFeedStore),
    getTotalInventoryValue: enhancedFeedStore.getTotalInventoryValue.bind(enhancedFeedStore),

    // Allocations
    allocations,
    addFeedAllocation: enhancedFeedStore.addFeedAllocation.bind(enhancedFeedStore),
    getPenAllocations: enhancedFeedStore.getPenAllocations.bind(enhancedFeedStore),
    getBarnAllocations: enhancedFeedStore.getBarnAllocations.bind(enhancedFeedStore),
    getPenFeedCosts: enhancedFeedStore.getPenFeedCosts.bind(enhancedFeedStore),

    // Mixer Batches
    mixerBatches,
    addMixerBatch: enhancedFeedStore.addMixerBatch.bind(enhancedFeedStore),

    // Analytics
    getFeedUsageStats: enhancedFeedStore.getFeedUsageStats.bind(enhancedFeedStore),
  }
}
