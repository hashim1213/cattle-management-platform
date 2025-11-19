"use client"

import { DollarSign, TrendingUp, TrendingDown, Calculator, AlertCircle, Loader2, Skull } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CostBreakdownChart } from "@/components/cost-breakdown-chart"
import { CostOfGainChart } from "@/components/cost-of-gain-chart"
import { TreatmentCostsCard } from "@/components/treatment-costs-card"
import { OtherCostsCard } from "@/components/other-costs-card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { financialCalculator, CattleCostBreakdown } from "@/lib/financial-calculator"
import { Badge } from "@/components/ui/badge"
import { useFarmSettings } from "@/hooks/use-farm-settings"

interface CostSummary {
  totalCostPerHead: number
  avgCostOfGain: number
  totalFeedCost: number
  projectedBreakeven: number
  totalInvestment: number
  projectedProfit: number
  roiPercentage: number
  deceasedCount: number
  deceasedLoss: number
}

interface CattleWithAnalysis {
  id: string
  tagNumber: string
  currentWeight: number
  projectedWeight: number
  breakEvenPrice: number
  projectedProfit: number
  recommendations: string[]
}

interface PenProfitability {
  penId: string
  penName: string
  cattleCount: number
  totalInvestment: number
  totalProjectedRevenue: number
  projectedProfit: number
  avgBreakEven: number
  roiPercentage: number
}

export default function CostsPage() {
  const { cattlePricePerLb } = useFarmSettings()
  const [costSummary, setCostSummary] = useState<CostSummary>({
    totalCostPerHead: 0,
    avgCostOfGain: 0,
    totalFeedCost: 0,
    projectedBreakeven: 0,
    totalInvestment: 0,
    projectedProfit: 0,
    roiPercentage: 0,
    deceasedCount: 0,
    deceasedLoss: 0
  })

  const [topAnimals, setTopAnimals] = useState<CattleWithAnalysis[]>([])
  const [bottomAnimals, setBottomAnimals] = useState<CattleWithAnalysis[]>([])
  const [penProfitability, setPenProfitability] = useState<PenProfitability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateFinancials()
  }, [cattlePricePerLb])

  const calculateFinancials = async () => {
    try {
      const cattle = await firebaseDataStore.getCattle()
      const pens = firebasePenStore.getPens()
      const currentMarketPrice = cattlePricePerLb // Use configurable market price from settings

    // Separate active and deceased cattle
    const activeCattle = cattle.filter(c => c.status === "Active")
    const deceasedCattle = cattle.filter(c => c.status === "Deceased")

    let totalInvestment = 0
    let totalActualRevenue = 0
    let totalHealthCosts = 0
    let deceasedTotalLoss = 0
    const cattleAnalyses: CattleWithAnalysis[] = []
    const penFinancials: Record<string, { investment: number; revenue: number; weight: number; count: number; penName: string }> = {}

    // Calculate deceased cattle losses using actual data
    for (const animal of deceasedCattle) {
      // Use actual purchase price or estimate if not available
      const purchasePrice = animal.purchasePrice || 0

      // Get actual health costs from records
      let healthCosts = 0
      try {
        const healthRecords = await firebaseDataStore.getHealthRecords(animal.id)
        healthCosts = healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
      } catch (error) {
        healthCosts = 0
      }

      const totalLoss = purchasePrice + healthCosts
      deceasedTotalLoss += totalLoss
    }

    // Calculate actual costs for active cattle
    for (const animal of activeCattle) {
      const currentWeight = animal.weight || 0
      const purchasePrice = animal.purchasePrice || 0

      // Get actual health costs from records
      let healthCosts = 0
      try {
        const healthRecords = await firebaseDataStore.getHealthRecords(animal.id)
        healthCosts = healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
      } catch (error) {
        healthCosts = 0
      }

      // Calculate total cost (purchase + health)
      const totalCost = purchasePrice + healthCosts

      // Calculate actual revenue based on current weight and market price
      const actualRevenue = currentWeight * currentMarketPrice

      // Calculate profit for this animal
      const profit = actualRevenue - totalCost

      totalInvestment += totalCost
      totalHealthCosts += healthCosts
      totalActualRevenue += actualRevenue

      cattleAnalyses.push({
        id: animal.id,
        tagNumber: animal.tagNumber,
        currentWeight,
        projectedWeight: currentWeight, // Use current weight
        breakEvenPrice: currentWeight > 0 ? totalCost / currentWeight : 0,
        projectedProfit: profit,
        recommendations: []
      })

      // Group by pen
      if (animal.penId) {
        if (!penFinancials[animal.penId]) {
          const pen = pens.find(p => p.id === animal.penId)
          penFinancials[animal.penId] = {
            investment: 0,
            revenue: 0,
            weight: 0,
            count: 0,
            penName: pen?.name || `Pen ${animal.penId}`
          }
        }
        penFinancials[animal.penId].investment += totalCost
        penFinancials[animal.penId].revenue += actualRevenue
        penFinancials[animal.penId].weight += currentWeight
        penFinancials[animal.penId].count += 1
      }
    }

    const totalProfit = totalActualRevenue - totalInvestment - deceasedTotalLoss
    const roiPercentage = (totalInvestment + deceasedTotalLoss) > 0
      ? ((totalProfit / (totalInvestment + deceasedTotalLoss)) * 100)
      : 0
    const avgCostPerHead = activeCattle.length > 0 ? totalInvestment / activeCattle.length : 0
    const totalCurrentWeight = cattleAnalyses.reduce((sum, c) => sum + c.currentWeight, 0)
    const avgBreakEven = totalCurrentWeight > 0 ? totalInvestment / totalCurrentWeight : 0

    // Calculate actual weight gain
    const totalStartWeight = activeCattle.reduce((sum, c) => sum + (c.purchaseWeight || c.arrivalWeight || 0), 0)
    const totalGain = totalCurrentWeight - totalStartWeight
    const avgCostOfGain = totalGain > 0 ? (totalHealthCosts / totalGain) : 0

    // Round all summary numbers
    setCostSummary({
      totalCostPerHead: Math.round(avgCostPerHead),
      avgCostOfGain: Math.round(avgCostOfGain * 100) / 100,
      totalFeedCost: Math.round(totalHealthCosts), // Use actual health costs instead of estimated feed
      projectedBreakeven: Math.round(avgBreakEven * 100) / 100,
      totalInvestment: Math.round(totalInvestment),
      projectedProfit: Math.round(totalProfit),
      roiPercentage: Math.round(roiPercentage * 10) / 10,
      deceasedCount: deceasedCattle.length,
      deceasedLoss: Math.round(deceasedTotalLoss)
    })

    // Calculate pen profitability
    const penProfitabilityData: PenProfitability[] = Object.entries(penFinancials).map(([penId, data]) => {
      const profit = data.revenue - data.investment
      const roi = (profit / data.investment) * 100
      const avgBreakEvenPen = data.investment / data.weight

      return {
        penId,
        penName: data.penName,
        cattleCount: data.count,
        totalInvestment: Math.round(data.investment),
        totalProjectedRevenue: Math.round(data.revenue),
        projectedProfit: Math.round(profit),
        avgBreakEven: Math.round(avgBreakEvenPen * 100) / 100,
        roiPercentage: Math.round(roi * 10) / 10
      }
    }).sort((a, b) => b.projectedProfit - a.projectedProfit)

    setPenProfitability(penProfitabilityData)

      // Sort by profitability
      const sorted = [...cattleAnalyses].sort((a, b) => b.projectedProfit - a.projectedProfit)
      setTopAnimals(sorted.slice(0, 5))
      setBottomAnimals(sorted.slice(-5).reverse())
    } catch (error) {
      console.error("Failed to calculate financials:", error)
    } finally {
      setLoading(false)
    }
  }

  const costMetrics = [
    {
      title: "Total Investment",
      value: `$${Math.round(costSummary.totalInvestment).toLocaleString()}`,
      change: `$${Math.round(costSummary.totalCostPerHead).toLocaleString()} per head`,
      trend: "neutral" as const,
      icon: DollarSign,
    },
    {
      title: "Healthcare Costs",
      value: `$${Math.round(costSummary.totalFeedCost).toLocaleString()}`,
      change: `From health records`,
      trend: "neutral" as const,
      icon: TrendingUp,
    },
    {
      title: "Breakeven Price",
      value: `$${costSummary.projectedBreakeven.toFixed(2)}/lb`,
      change: `Market: $${cattlePricePerLb.toFixed(2)}/lb`,
      trend: costSummary.projectedBreakeven < cattlePricePerLb ? "down" as const : "up" as const,
      icon: Calculator,
    },
    {
      title: "Current Profit/Loss",
      value: `${costSummary.roiPercentage > 0 ? '+' : ''}$${Math.round(costSummary.projectedProfit).toLocaleString()}`,
      change: `ROI: ${costSummary.roiPercentage.toFixed(1)}%`,
      trend: costSummary.roiPercentage > 0 ? "up" as const : "down" as const,
      icon: costSummary.roiPercentage > 0 ? TrendingUp : TrendingDown,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block touch-manipulation">
                ← Back
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Financial Overview</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track actual costs, revenue, and current profitability</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-safe">
        {/* Cost Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {costMetrics.map((metric, index) => {
            const Icon = metric.icon
            const trendColors = {
              up: "text-red-600",
              down: "text-green-600",
              neutral: "text-muted-foreground",
            }
            const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Calculator

            return (
              <Card key={index} className="touch-manipulation">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <TrendIcon className={`h-4 w-4 ${trendColors[metric.trend]}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground truncate">{metric.change}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost of Gain Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <CostOfGainChart />
            </CardContent>
          </Card>
        </div>

        {/* Treatment Costs */}
        <TreatmentCostsCard />

        {/* Deceased Cattle Losses */}
        {costSummary.deceasedCount > 0 && (
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900 dark:text-red-100">Deceased Cattle Losses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-muted-foreground mb-1">Deceased Cattle</p>
                    <p className="text-2xl font-bold text-red-600">{costSummary.deceasedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total head lost</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-muted-foreground mb-1">Total Loss</p>
                    <p className="text-2xl font-bold text-red-600">${costSummary.deceasedLoss.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Investment lost</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-muted-foreground mb-1">Avg Loss Per Head</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${Math.round(costSummary.deceasedLoss / (costSummary.deceasedCount || 1)).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Per deceased animal</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Impact on ROI</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Deceased cattle losses have been factored into your profitability calculations. Consider reviewing health protocols and mortality prevention strategies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operating Costs (Labour, Utilities, etc.) */}
        <OtherCostsCard />

        {/* Pen Profitability */}
        <Card>
          <CardHeader>
            <CardTitle>Profitability by Pen</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Calculating...</p>
            ) : penProfitability.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pen data available</p>
            ) : (
              <div className="space-y-3">
                {penProfitability.map((pen) => (
                  <div key={pen.penId} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{pen.penName}</span>
                        <Badge variant="outline" className="text-xs">{pen.cattleCount} head</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Investment</p>
                          <p className="font-medium">${Math.round(pen.totalInvestment / 1000)}k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Break-Even</p>
                          <p className="font-medium">${pen.avgBreakEven.toFixed(2)}/lb</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">ROI</p>
                          <p className={`font-medium ${pen.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pen.roiPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground mb-1">Projected Profit</p>
                      <p className={`text-2xl font-bold ${pen.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pen.projectedProfit >= 0 ? '+' : ''}${Math.round(pen.projectedProfit / 1000)}k
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profitability Analysis */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top 5 Most Profitable
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Calculating...</p>
              ) : topAnimals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-4">
                  {topAnimals.map((animal, index) => (
                    <div key={animal.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                          <span className="font-medium">#{animal.tagNumber}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {animal.currentWeight} → {animal.projectedWeight} lbs
                        </div>
                        <div className="text-xs">
                          Break-even: ${animal.breakEvenPrice.toFixed(2)}/lb
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +${Math.round(animal.projectedProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">Projected</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Bottom 5 - Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Calculating...</p>
              ) : bottomAnimals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-4">
                  {bottomAnimals.map((animal, index) => (
                    <div key={animal.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{animal.tagNumber}</span>
                          {animal.projectedProfit < 0 && (
                            <Badge variant="destructive" className="text-xs">Loss</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {animal.currentWeight} → {animal.projectedWeight} lbs
                        </div>
                        <div className="text-xs">
                          Break-even: ${animal.breakEvenPrice.toFixed(2)}/lb
                        </div>
                        {animal.recommendations.length > 0 && (
                          <div className="text-xs text-amber-600 mt-1">
                            {animal.recommendations[0]}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${animal.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {animal.projectedProfit >= 0 ? '+' : ''}${Math.round(animal.projectedProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">Projected</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
