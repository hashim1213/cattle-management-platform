"use client"

import { DollarSign, TrendingUp, TrendingDown, Calculator, AlertCircle, Loader2 } from "lucide-react"
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
    roiPercentage: 0
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

    let totalInvestment = 0
    let totalFeedCost = 0
    let totalProjectedRevenue = 0
    const cattleAnalyses: CattleWithAnalysis[] = []
    const penFinancials: Record<string, { investment: number; revenue: number; weight: number; count: number; penName: string }> = {}

    cattle.forEach(animal => {
      // Estimate costs based on animal data
      const daysOnFeed = animal.daysOnFeed || 120
      const purchaseWeight = animal.purchaseWeight || animal.weight || 600
      const currentWeight = animal.weight || 850
      const projectedWeight = animal.projectedWeight || 1200

      const costs: CattleCostBreakdown = {
        purchasePrice: animal.purchasePrice || (purchaseWeight * 1.50), // Use actual purchase price if available
        transportationCost: 50,
        commissionFees: 30,
        feedCostPerDay: 3.50,
        healthcareCostPerDay: 0.25,
        laborCostPerDay: 0.50,
        facilityCostPerDay: 0.35,
        vaccinations: 45,
        treatments: 20,
        equipmentAllocation: 25,
        daysOnFeed,
        interestRate: 5.5
      }

      const analysis = financialCalculator.calculateBreakEven(
        costs,
        currentWeight,
        projectedWeight,
        currentMarketPrice
      )

      totalInvestment += analysis.totalCosts.total
      totalFeedCost += analysis.totalCosts.feed
      totalProjectedRevenue += projectedWeight * currentMarketPrice

      cattleAnalyses.push({
        id: animal.id,
        tagNumber: animal.tagNumber,
        currentWeight,
        projectedWeight,
        breakEvenPrice: analysis.breakEven.pricePerPound,
        projectedProfit: analysis.projectedProfit.atCurrentMarketPrice,
        recommendations: analysis.recommendations
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
        penFinancials[animal.penId].investment += analysis.totalCosts.total
        penFinancials[animal.penId].revenue += projectedWeight * currentMarketPrice
        penFinancials[animal.penId].weight += projectedWeight
        penFinancials[animal.penId].count += 1
      }
    })

    const totalProfit = totalProjectedRevenue - totalInvestment
    const roiPercentage = (totalProfit / totalInvestment) * 100
    const avgCostPerHead = totalInvestment / (cattle.length || 1)
    const totalProjectedWeight = cattleAnalyses.reduce((sum, c) => sum + c.projectedWeight, 0)
    const avgBreakEven = totalInvestment / (totalProjectedWeight || 1)
    const totalGain = cattleAnalyses.reduce((sum, c) => sum + (c.projectedWeight - c.currentWeight), 0)
    const avgCostOfGain = totalFeedCost / (totalGain || 1)

    // Round all summary numbers
    setCostSummary({
      totalCostPerHead: Math.round(avgCostPerHead),
      avgCostOfGain: Math.round(avgCostOfGain * 100) / 100,
      totalFeedCost: Math.round(totalFeedCost),
      projectedBreakeven: Math.round(avgBreakEven * 100) / 100,
      totalInvestment: Math.round(totalInvestment),
      projectedProfit: Math.round(totalProfit),
      roiPercentage: Math.round(roiPercentage * 10) / 10
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
      title: "Avg Cost Per Head",
      value: `$${Math.round(costSummary.totalCostPerHead).toLocaleString()}`,
      change: `Total Investment: $${Math.round(costSummary.totalInvestment / 1000)}k`,
      trend: "neutral" as const,
      icon: DollarSign,
    },
    {
      title: "Cost of Gain",
      value: `$${costSummary.avgCostOfGain.toFixed(2)}/lb`,
      change: costSummary.avgCostOfGain > 1.0 ? "Above target ($1.00)" : "On target",
      trend: costSummary.avgCostOfGain > 1.0 ? "up" as const : "down" as const,
      icon: TrendingUp,
    },
    {
      title: "Breakeven Price",
      value: `$${costSummary.projectedBreakeven.toFixed(2)}/lb`,
      change: `Current market: $${cattlePricePerLb.toFixed(2)}/lb`,
      trend: costSummary.projectedBreakeven < cattlePricePerLb ? "down" as const : "up" as const,
      icon: Calculator,
    },
    {
      title: "Projected ROI",
      value: `${costSummary.roiPercentage.toFixed(1)}%`,
      change: `Profit: $${Math.round(costSummary.projectedProfit / 1000)}k`,
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
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Costs & Expenses</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track all your farm costs and see your profit projections</p>
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
