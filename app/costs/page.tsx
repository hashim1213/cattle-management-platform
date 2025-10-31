"use client"

import { DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CostBreakdownChart } from "@/components/cost-breakdown-chart"
import { CostPerHeadTable } from "@/components/cost-per-head-table"
import { CostOfGainChart } from "@/components/cost-of-gain-chart"
import Link from "next/link"

export default function CostsPage() {
  // Mock data - will be replaced with real data
  const costSummary = {
    totalCostPerHead: 1847,
    avgCostOfGain: 0.92,
    totalFeedCost: 456789,
    projectedBreakeven: 1.45,
  }

  const costMetrics = [
    {
      title: "Avg Cost Per Head",
      value: `$${costSummary.totalCostPerHead.toLocaleString()}`,
      change: "+$23 from last week",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Cost of Gain",
      value: `$${costSummary.avgCostOfGain}/lb`,
      change: "15% above target",
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      title: "Total Feed Cost",
      value: `$${(costSummary.totalFeedCost / 1000).toFixed(1)}k`,
      change: "This month",
      trend: "neutral" as const,
      icon: Calculator,
    },
    {
      title: "Breakeven Price",
      value: `$${costSummary.projectedBreakeven}/lb`,
      change: "Projected",
      trend: "neutral" as const,
      icon: TrendingDown,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Cost Tracking</h1>
              <p className="text-sm text-muted-foreground">Monitor production costs and profitability</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Cost Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {costMetrics.map((metric, index) => {
            const Icon = metric.icon
            const trendColors = {
              up: "text-red-600",
              down: "text-green-600",
              neutral: "text-muted-foreground",
            }
            const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Calculator

            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <TrendIcon className={`h-4 w-4 ${trendColors[metric.trend]}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.change}</p>
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

        {/* Cost Per Head Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Per Head by Lot</CardTitle>
          </CardHeader>
          <CardContent>
            <CostPerHeadTable />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
