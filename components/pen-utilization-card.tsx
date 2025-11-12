"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Grid3x3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PenUtilization {
  totalPens: number
  totalCapacity: number
  totalOccupied: number
  utilizationRate: number
  fullPens: number
  emptyPens: number
  underutilizedPens: number
}

export function PenUtilizationCard() {
  const [utilization, setUtilization] = useState<PenUtilization>({
    totalPens: 0,
    totalCapacity: 0,
    totalOccupied: 0,
    utilizationRate: 0,
    fullPens: 0,
    emptyPens: 0,
    underutilizedPens: 0,
  })

  useEffect(() => {
    const loadUtilization = () => {
      const analytics = firebasePenStore.getPenAnalytics()
      const pens = firebasePenStore.getPens()

      const fullPens = pens.filter(p => p.currentCount >= p.capacity).length
      const emptyPens = pens.filter(p => p.currentCount === 0).length
      const underutilizedPens = pens.filter(p => {
        const rate = p.capacity > 0 ? (p.currentCount / p.capacity) * 100 : 0
        return rate > 0 && rate < 50
      }).length

      setUtilization({
        ...analytics,
        fullPens,
        emptyPens,
        underutilizedPens,
      })
    }

    loadUtilization()

    // Subscribe to pen store updates
    const unsubscribe = firebasePenStore.subscribe(loadUtilization)
    return () => unsubscribe()
  }, [])

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "text-destructive"
    if (rate >= 70) return "text-yellow-600 dark:text-yellow-500"
    if (rate >= 40) return "text-green-600 dark:text-green-500"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pen Utilization</CardTitle>
          </div>
          <Link href="/pens/manage">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Manage →
            </Button>
          </Link>
        </div>
        <CardDescription>Overall pen capacity status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Utilization Rate</span>
            <span className={`text-2xl font-bold ${getUtilizationColor(utilization.utilizationRate)}`}>
              {utilization.utilizationRate.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min(utilization.utilizationRate, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{utilization.totalOccupied} / {utilization.totalCapacity} head</span>
            <span>{utilization.totalPens} pens</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-destructive mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Full</span>
            </div>
            <p className="text-lg font-bold">{utilization.fullPens}</p>
          </div>

          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Low</span>
            </div>
            <p className="text-lg font-bold">{utilization.underutilizedPens}</p>
          </div>

          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-500 mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Empty</span>
            </div>
            <p className="text-lg font-bold">{utilization.emptyPens}</p>
          </div>
        </div>

        {utilization.totalPens === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No pens configured</p>
            <Link href="/pens">
              <Button variant="outline" size="sm">
                Set up pens
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
