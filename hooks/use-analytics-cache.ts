import { useState, useEffect, useCallback } from "react"
import { firebaseDataStore } from "@/lib/data-store-firebase"

interface CachedData<T> {
  data: T
  timestamp: number
}

const CACHE_KEY = "dashboard_analytics_cache"
const CACHE_TTL = 30 * 1000 // 30 seconds in milliseconds (reduced from 5 minutes for real-time updates)

/**
 * Hook to cache analytics data and reduce loading times
 * Data is cached for 30 seconds before being refreshed
 * Cache is automatically invalidated when cattle data changes
 */
export function useAnalyticsCache(cattlePricePerLb: number) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const getCachedData = useCallback((): CachedData<any> | null => {
    if (typeof window === "undefined") return null

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const parsedCache: CachedData<any> = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - parsedCache.timestamp < CACHE_TTL) {
        return parsedCache
      }

      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY)
      return null
    } catch (err) {
      console.error("Error reading cache:", err)
      return null
    }
  }, [])

  const setCachedData = useCallback((data: any) => {
    if (typeof window === "undefined") return

    try {
      const cacheData: CachedData<any> = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (err) {
      console.error("Error setting cache:", err)
    }
  }, [])

  const loadAnalytics = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      // Try to use cached data first
      if (useCache) {
        const cached = getCachedData()
        if (cached) {
          setAnalytics(cached.data)
          setLoading(false)
          return cached.data
        }
      }

      // Fetch fresh data
      const data = await firebaseDataStore.getAnalytics(cattlePricePerLb)
      setAnalytics(data)
      setCachedData(data)
      setLoading(false)
      return data
    } catch (err) {
      console.error("Failed to load analytics:", err)
      setError(err as Error)
      setLoading(false)

      // Return default data on error
      const defaultData = {
        totalCattle: 0,
        activeCattle: 0,
        healthyCount: 0,
        sickCount: 0,
        avgWeight: 0,
        avgDailyGain: 0,
        totalValue: 0,
        totalInventoryValue: 0,
        costPerHead: 0,
        bulls: { count: 0, herdSires: 0, herdSireProspects: 0 },
        cows: { count: 0, pregnant: 0, open: 0, exposed: 0 },
        calves: { count: 0, unweaned: 0, weaned: 0 },
      }
      setAnalytics(defaultData)
      return defaultData
    }
  }, [cattlePricePerLb, getCachedData, setCachedData])

  const invalidateCache = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const refreshData = useCallback(() => {
    return loadAnalytics(false)
  }, [loadAnalytics])

  // Auto-load analytics on mount and when cattlePricePerLb changes
  useEffect(() => {
    loadAnalytics()
  }, [cattlePricePerLb, loadAnalytics])

  // Auto-invalidate cache when cattle data changes (for real-time updates)
  useEffect(() => {
    const unsubscribe = firebaseDataStore.subscribe(() => {
      // Invalidate cache when any cattle data changes
      invalidateCache()
      // Optionally reload data immediately for faster updates
      loadAnalytics(false)
    })

    return () => unsubscribe()
  }, [invalidateCache, loadAnalytics])

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    refreshData,
    invalidateCache
  }
}
