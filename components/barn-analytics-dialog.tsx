"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { dataStore } from "@/lib/data-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { DollarSign, TrendingUp, TrendingDown, Activity, Package } from "lucide-react"

interface BarnAnalyticsDialogProps {
  barnId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BarnAnalyticsDialog({ barnId, open, onOpenChange }: BarnAnalyticsDialogProps) {
  const { barns, pens } = usePenStore()

  if (!barnId) return null

  const barn = barns.find((b) => b.id === barnId)
  if (!barn) return null

  const barnPens = pens.filter((p) => p.barnId === barnId)
  const allCattle = dataStore.getCattle().filter((c) => c.status === "Active")
  const barnCattle = allCattle.filter((c) => c.barnId === barnId)

  // Calculate comprehensive analytics
  const totalCattle = barnCattle.length
  const totalCapacity = barnPens.reduce((sum, p) => sum + p.capacity, 0)
  const utilizationRate = totalCapacity > 0 ? (totalCattle / totalCapacity) * 100 : 0

  const totalPurchaseValue = barnCattle.reduce((sum, c) => sum + (Number(c.purchasePrice) || 0), 0)
  const totalCurrentWeight = barnCattle.reduce((sum, c) => {
    const currentWeight = c.weights?.[c.weights.length - 1]?.weight || Number(c.purchaseWeight) || 0
    return sum + currentWeight
  }, 0)

  // Estimate costs
  const avgDaysOnFeed = barnCattle.reduce((sum, c) => {
    if (!c.purchaseDate) return sum
    const days = Math.floor((Date.now() - new Date(c.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
    return sum + days
  }, 0) / (barnCattle.length || 1)

  const estimatedFeedCostPerDay = 3.50 // $3.50 per head per day
  const totalFeedCost = barnCattle.reduce((sum, c) => {
    if (!c.purchaseDate) return sum
    const days = Math.floor((Date.now() - new Date(c.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
    return sum + (days * estimatedFeedCostPerDay)
  }, 0)

  // Operating costs estimate
  const monthlyBarnMaintenance = 500 // Example fixed cost
  const monthsInOperation = Math.max(1, avgDaysOnFeed / 30)
  const totalBarnMaintenance = monthlyBarnMaintenance * monthsInOperation

  const veterinaryCosts = 75 * barnCattle.length // Estimate $75 per head
  const totalOperatingCosts = totalFeedCost + totalBarnMaintenance + veterinaryCosts

  // Total investment
  const totalInvestment = totalPurchaseValue + totalOperatingCosts

  // Break-even and profitability
  const costPerPound = totalCurrentWeight > 0 ? totalInvestment / totalCurrentWeight : 0
  const marketPrice = 1.85 // Example market price per pound
  const projectedValue = totalCurrentWeight * marketPrice
  const currentProfitLoss = projectedValue - totalInvestment
  const profitMargin = totalInvestment > 0 ? (currentProfitLoss / totalInvestment) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{barn.name} - Analytics Dashboard</DialogTitle>
          <DialogDescription>
            Comprehensive financial and operational analytics for this barn
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Cattle</p>
                    <p className="text-2xl font-bold">{totalCattle}</p>
                    <p className="text-xs text-muted-foreground">{totalCapacity} capacity</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold">{utilizationRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{barnPens.length} pens</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Weight</p>
                    <p className="text-2xl font-bold">{totalCurrentWeight.toLocaleString()} lbs</p>
                    <p className="text-xs text-muted-foreground">{(totalCurrentWeight / (barnCattle.length || 1)).toFixed(0)} avg/head</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={currentProfitLoss >= 0 ? "border-green-500" : "border-red-500"}>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Profit/Loss</p>
                    <p className={`text-2xl font-bold flex items-center gap-1 ${currentProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {currentProfitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      ${Math.abs(currentProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Purchase Cost</span>
                    <span className="font-semibold">${totalPurchaseValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Feed Costs</span>
                    <span className="font-semibold">${totalFeedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Barn Maintenance</span>
                    <span className="font-semibold">${totalBarnMaintenance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Veterinary Costs</span>
                    <span className="font-semibold">${veterinaryCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-muted/50 px-3 rounded font-semibold">
                    <span>Total Investment</span>
                    <span>${totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className={`flex justify-between py-3 px-3 rounded font-semibold ${currentProfitLoss >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <span>Projected Value</span>
                    <span className={currentProfitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                      ${projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Break-Even Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Break-Even Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Break-Even Price</p>
                    <p className="text-xl font-bold">${costPerPound.toFixed(2)}/lb</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Market Price</p>
                    <p className="text-xl font-bold">${marketPrice.toFixed(2)}/lb</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margin per Pound</p>
                    <p className={`text-xl font-bold ${marketPrice >= costPerPound ? "text-green-600" : "text-red-600"}`}>
                      ${(marketPrice - costPerPound).toFixed(2)}/lb
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operational Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Days on Feed</p>
                    <p className="text-xl font-bold">{avgDaysOnFeed.toFixed(0)} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost per Head per Day</p>
                    <p className="text-xl font-bold">${estimatedFeedCostPerDay.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Daily Feed Cost</p>
                    <p className="text-xl font-bold">${(barnCattle.length * estimatedFeedCostPerDay).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pen Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Pen Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {barnPens.map((pen) => {
                    const penCattle = barnCattle.filter((c) => c.penId === pen.id)
                    const penUtilization = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
                    return (
                      <div key={pen.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{pen.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pen.currentCount}/{pen.capacity} head ({penUtilization.toFixed(0)}%)
                          </p>
                        </div>
                        <Badge variant={penUtilization > 90 ? "destructive" : penUtilization > 70 ? "default" : "secondary"}>
                          {penUtilization > 90 ? "Full" : penUtilization > 70 ? "High" : "Available"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
