"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Wheat, Syringe } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import type { Pen } from "@/lib/pen-store-firebase"

interface PenROICardProps {
  pen: Pen
  estimatedRevenue?: number
}

export function PenROICard({ pen, estimatedRevenue = 0 }: PenROICardProps) {
  const { getTotalFeedCostByPen, getTotalMedicationCostByPen, getPenROI } = usePenActivity()
  const [feedCost, setFeedCost] = useState(0)
  const [medCost, setMedCost] = useState(0)
  const [roi, setROI] = useState<{
    totalFeedCost: number
    totalMedicationCost: number
    totalCosts: number
    revenue: number
    profit: number
    roi: number
  } | null>(null)

  useEffect(() => {
    const feed = getTotalFeedCostByPen(pen.id)
    const meds = getTotalMedicationCostByPen(pen.id)
    const roiData = getPenROI(pen.id, estimatedRevenue)

    setFeedCost(feed)
    setMedCost(meds)
    setROI(roiData)
  }, [pen.id, estimatedRevenue, getTotalFeedCostByPen, getTotalMedicationCostByPen, getPenROI])

  if (!roi) {
    return null
  }

  const profitColor = roi.profit >= 0 ? "text-green-600" : "text-red-600"
  const roiColor = roi.roi >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pen Financial Summary
        </CardTitle>
        <CardDescription>
          Costs and ROI for {pen.name} ({pen.currentCount} head)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Costs Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wheat className="h-4 w-4" />
                <span>Feed Costs</span>
              </div>
              <span className="font-medium">${feedCost.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Syringe className="h-4 w-4" />
                <span>Medication Costs</span>
              </div>
              <span className="font-medium">${medCost.toFixed(2)}</span>
            </div>

            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Total Costs</span>
              <span className="font-bold">${roi.totalCosts.toFixed(2)}</span>
            </div>
          </div>

          {/* Revenue & Profit */}
          {estimatedRevenue > 0 && (
            <>
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Revenue</span>
                  <span className="font-medium">${roi.revenue.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profit/Loss</span>
                  <span className={`font-bold flex items-center gap-1 ${profitColor}`}>
                    {roi.profit >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    ${Math.abs(roi.profit).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ROI</span>
                  <Badge variant="secondary" className={roiColor}>
                    {roi.roi >= 0 ? "+" : ""}{roi.roi.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </>
          )}

          {/* Per Head Breakdown */}
          {pen.currentCount > 0 && (
            <div className="border-t pt-3 bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Per Head</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Feed</p>
                  <p className="font-medium">${(feedCost / pen.currentCount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Meds</p>
                  <p className="font-medium">${(medCost / pen.currentCount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Cost</p>
                  <p className="font-medium">${(roi.totalCosts / pen.currentCount).toFixed(2)}</p>
                </div>
                {estimatedRevenue > 0 && (
                  <div>
                    <p className="text-muted-foreground">Profit</p>
                    <p className={`font-medium ${profitColor}`}>
                      ${(roi.profit / pen.currentCount).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
