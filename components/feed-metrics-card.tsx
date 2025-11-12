"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wheat, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { feedService } from "@/lib/feed/feed-service"
import { Badge } from "@/components/ui/badge"

interface FeedMetrics {
  totalAllocations: number
  totalCost: number
  totalWeight: number
  averageCostPerHead: number
}

export function FeedMetricsCard() {
  const [metrics, setMetrics] = useState<FeedMetrics>({
    totalAllocations: 0,
    totalCost: 0,
    totalWeight: 0,
    averageCostPerHead: 0,
  })
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    const loadMetrics = () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
      const allocations = feedService.getRecentAllocations(days)

      const totalCost = allocations.reduce((sum, a) => sum + a.totalCost, 0)
      const totalWeight = allocations.reduce((sum, a) => sum + a.totalWeight, 0)
      const totalHeadDays = allocations.reduce((sum, a) => sum + a.headCount, 0)
      const averageCostPerHead = totalHeadDays > 0 ? totalCost / totalHeadDays : 0

      setMetrics({
        totalAllocations: allocations.length,
        totalCost,
        totalWeight,
        averageCostPerHead,
      })
    }

    loadMetrics()

    // Subscribe to feed service updates
    const unsubscribe = feedService.subscribe(loadMetrics)
    return () => unsubscribe()
  }, [period])

  const getPeriodLabel = () => {
    switch (period) {
      case "7d":
        return "Last 7 days"
      case "30d":
        return "Last 30 days"
      case "90d":
        return "Last 90 days"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Feed Allocation</CardTitle>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPeriod("7d")}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                period === "7d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                period === "30d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              30d
            </button>
            <button
              onClick={() => setPeriod("90d")}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                period === "90d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              90d
            </button>
          </div>
        </div>
        <CardDescription>{getPeriodLabel()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Allocations</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalAllocations}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Total Cost</span>
            </div>
            <p className="text-2xl font-bold">${metrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wheat className="h-3.5 w-3.5" />
              <span className="text-xs">Total Weight</span>
            </div>
            <p className="text-2xl font-bold">{(metrics.totalWeight / 2000).toFixed(1)}<span className="text-sm text-muted-foreground ml-1">tons</span></p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">Avg/Head</span>
            </div>
            <p className="text-2xl font-bold">${metrics.averageCostPerHead.toFixed(2)}</p>
          </div>
        </div>

        {metrics.totalAllocations === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No feed allocations in this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
