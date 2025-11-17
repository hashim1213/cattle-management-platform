"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Package, Warehouse } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import { usePenStore } from "@/hooks/use-pen-store"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { useRouter } from "next/navigation"
import type { Cattle } from "@/lib/data-store-firebase"

export function PenOverviewCard() {
  const { getTotalFeedCostByPen, getTotalMedicationCostByPen } = usePenActivity()
  const { pens } = usePenStore()
  const { cattlePricePerLb } = useFarmSettings()
  const [cattle, setCattle] = useState<Cattle[]>([])
  const router = useRouter()

  // Load cattle data only once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const allCattle = await firebaseDataStore.getCattle()
        const activeCattle = allCattle.filter((c) => c.status === "Active" && c.penId)
        setCattle(activeCattle)
      } catch (error) {
        console.error("Error loading pen overview data:", error)
      }
    }

    loadData()

    // Subscribe to cattle changes
    const unsubscribe = firebaseDataStore.subscribe(() => {
      loadData()
    })

    return () => unsubscribe()
  }, [])

  // Memoize expensive calculations
  const totalSpent = useMemo(() => {
    let feedCosts = 0
    let medicationCosts = 0

    pens.forEach((pen) => {
      feedCosts += getTotalFeedCostByPen(pen.id)
      medicationCosts += getTotalMedicationCostByPen(pen.id)
    })

    return feedCosts + medicationCosts
  }, [pens, getTotalFeedCostByPen, getTotalMedicationCostByPen])

  const projectedRevenue = useMemo(() => {
    return cattle.reduce((sum, c) => {
      return sum + (c.weight * cattlePricePerLb)
    }, 0)
  }, [cattle, cattlePricePerLb])

  const totalCattleInPens = useMemo(() => {
    return cattle.length
  }, [cattle])

  const totalPurchasePrice = useMemo(() => {
    return cattle.reduce((sum, c) => {
      return sum + (c.purchasePrice || 0)
    }, 0)
  }, [cattle])

  const estimatedProfit = projectedRevenue - totalPurchasePrice - totalSpent
  const profitColor = estimatedProfit >= 0 ? "text-green-600" : "text-red-600"

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Pens */}
      <Card
        className="touch-manipulation cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
        onClick={() => router.push('/pens')}
      >
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

      {/* Estimated Profit */}
      <Card className="touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-3xl sm:text-4xl font-bold mb-1 sm:mb-2 ${profitColor}`}>
                {estimatedProfit >= 0 ? "+" : "-"}${Math.abs(estimatedProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">Est. Profit/Loss</p>
              <p className="text-sm text-muted-foreground">
                Revenue - Purchase - Costs
              </p>
            </div>
            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full flex items-center justify-center ${
              estimatedProfit >= 0 ? "bg-green-100" : "bg-red-100"
            }`}>
              {estimatedProfit >= 0 ? (
                <TrendingUp className={`h-6 w-6 sm:h-7 sm:w-7 ${estimatedProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
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
