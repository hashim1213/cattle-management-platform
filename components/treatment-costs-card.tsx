"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Syringe, DollarSign, TrendingUp, Calendar } from "lucide-react"
import { healthService } from "@/lib/health/health-service"

export function TreatmentCostsCard() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    end: new Date().toISOString().split("T")[0] // Today
  })
  const [stats, setStats] = useState({
    totalTreatments: 0,
    totalCost: 0,
    treatmentsByDrug: {} as Record<string, { count: number; cost: number }>,
    cattleTreated: 0
  })

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = () => {
    const treatmentStats = healthService.getTreatmentStats(dateRange)
    setStats(treatmentStats)
  }

  const costPerTreatment = stats.totalTreatments > 0 ? stats.totalCost / stats.totalTreatments : 0
  const costPerHead = stats.cattleTreated > 0 ? stats.totalCost / stats.cattleTreated : 0

  // Sort drugs by cost
  const drugsByCount = Object.entries(stats.treatmentsByDrug)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5" />
              Treatment Costs
            </CardTitle>
            <CardDescription>
              Health and medication expenses
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            ${stats.totalCost.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Filter */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Treatments</div>
            <div className="text-2xl font-bold">{stats.totalTreatments}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Cattle Treated</div>
            <div className="text-2xl font-bold">{stats.cattleTreated}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg/Treatment</div>
            <div className="text-2xl font-bold">${costPerTreatment.toFixed(2)}</div>
          </div>
        </div>

        {/* Top Drugs by Cost */}
        {drugsByCount.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Top Drugs by Cost</Label>
              <span className="text-xs text-muted-foreground">
                ${stats.totalCost.toFixed(2)} total
              </span>
            </div>
            <div className="space-y-2">
              {drugsByCount.map(([drugName, data]) => {
                const percentage = (data.cost / stats.totalCost) * 100
                return (
                  <div key={drugName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate flex-1">{drugName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {data.count}x
                        </Badge>
                        <span className="font-bold min-w-[60px] text-right">
                          ${data.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Data State */}
        {stats.totalTreatments === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Syringe className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No treatments recorded in this date range</p>
          </div>
        )}

        {/* Cost Insights */}
        {stats.cattleTreated > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Cost Per Head
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Average treatment cost: ${costPerHead.toFixed(2)} per animal
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
