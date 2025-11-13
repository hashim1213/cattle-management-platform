"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Package, Warehouse } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import { usePenStore } from "@/hooks/use-pen-store"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import type { Cattle } from "@/lib/data-store-firebase"

export function PenOverviewCard() {
  const { feedActivities, medicationActivities } = usePenActivity()
  const { pens } = usePenStore()
  const { cattlePricePerLb } = useFarmSettings()
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(true)

  // Load cattle data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const allCattle = await firebaseDataStore.getCattle()
        const activeCattle = allCattle.filter((c) => c.status === "Active" && c.penId)
        setCattle(activeCattle)
      } catch (error) {
        console.error("Error loading pen overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate costs from activity data (memoized)
  const totalSpent = useMemo(() => {
    const feedCosts = feedActivities.reduce((sum, activity) => sum + activity.totalCost, 0)
    const medicationCosts = medicationActivities.reduce((sum, activity) => sum + activity.totalCost, 0)
    return feedCosts + medicationCosts
  }, [feedActivities, medicationActivities])

  // Calculate projected revenue (memoized)
  const projectedRevenue = useMemo(() => {
    return cattle.reduce((sum, c) => sum + (c.weight * cattlePricePerLb), 0)
  }, [cattle, cattlePricePerLb])

  // Count cattle in pens (memoized)
  const totalCattleInPens = useMemo(() => cattle.length, [cattle])

  const profit = projectedRevenue - totalSpent
  const roi = totalSpent > 0 ? (profit / totalSpent) * 100 : 0
  const profitColor = profit >= 0 ? "text-green-600" : "text-red-600"

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Pens */}
      <Card className="touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">{pens.length}</p>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">Active Pens</p>
              <p className="text-sm text-muted-foreground">{totalCattleInPens} head total</p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
              <Warehouse className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">
                ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">Total Spent</p>
              <p className="text-sm text-muted-foreground">Feed & medication costs</p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projected Revenue */}
      <Card className="touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">
                ${projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">Projected Revenue</p>
              <p className="text-sm text-muted-foreground">
                At ${cattlePricePerLb.toFixed(2)}/lb
              </p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card className="touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-3xl sm:text-4xl font-bold mb-1 sm:mb-2 ${profitColor}`}>
                {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">ROI</p>
              <p className={`text-sm ${profitColor}`}>
                {profit >= 0 ? "+" : "-"}${Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
              </p>
            </div>
            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full flex items-center justify-center ${
              profit >= 0 ? "bg-green-100" : "bg-red-100"
            }`}>
              {profit >= 0 ? (
                <TrendingUp className={`h-6 w-6 sm:h-7 sm:w-7 ${profit >= 0 ? "text-green-600" : "text-red-600"}`} />
              ) : (
                <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
