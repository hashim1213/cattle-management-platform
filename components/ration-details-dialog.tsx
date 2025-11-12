"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRationStore } from "@/hooks/use-ration-store"
import { rationCalculator, type RationPerformanceMetrics } from "@/lib/ration-calculator"
import { Download, TrendingUp, DollarSign, Activity, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Ration } from "@/lib/ration-store"

interface RationDetailsDialogProps {
  ration: Ration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RationDetailsDialog({ ration, open, onOpenChange }: RationDetailsDialogProps) {
  const { getRationUsageStats, exportRationData } = useRationStore()
  const { toast } = useToast()
  const [performance, setPerformance] = useState<RationPerformanceMetrics | null>(null)

  useEffect(() => {
    if (ration && open) {
      const metrics = rationCalculator.calculateRationPerformance(ration.id)
      setPerformance(metrics)
    }
  }, [ration, open])

  if (!ration) return null

  const stats = getRationUsageStats(ration.id)

  const handleExport = () => {
    const data = exportRationData(ration.id)
    if (!data) return

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ration-${ration.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Ration data has been exported for nutritionist review.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {ration.name}
                <Badge variant="outline" className="capitalize">
                  {ration.stage}
                </Badge>
              </DialogTitle>
              {ration.description && (
                <p className="text-sm text-muted-foreground mt-1">{ration.description}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="shrink-0">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Performance KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Average ADG
                  </p>
                  <p className="text-lg font-bold">
                    {performance?.averageADG.toFixed(2) || "0.00"} lbs
                  </p>
                  {performance && (
                    <p
                      className={`text-xs ${performance.adgVariance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {performance.adgVariance >= 0 ? "+" : ""}
                      {performance.adgVariance.toFixed(1)}% vs target
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Feed Conversion
                  </p>
                  <p className="text-lg font-bold">
                    {performance?.feedConversion.toFixed(2) || "0.00"}:1
                  </p>
                  {performance && (
                    <p
                      className={`text-xs ${performance.fcVariance <= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {performance.fcVariance >= 0 ? "+" : ""}
                      {performance.fcVariance.toFixed(1)}% vs target
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Cost/Lb Gain
                  </p>
                  <p className="text-lg font-bold">${performance?.costPerPoundGain.toFixed(3) || "0.000"}</p>
                  <p className="text-xs text-muted-foreground">
                    ${ration.kpis.costPerHead.toFixed(2)}/head/day
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Daily Feed Cost
                  </p>
                  <p className="text-lg font-bold">
                    ${performance?.totalDailyCost.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalHeadCount} head total
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ration Composition */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Ration Composition</h3>
              <div className="space-y-3">
                {ration.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{ingredient.feedName}</p>
                      <p className="text-sm text-muted-foreground">
                        {ingredient.amountLbs} lbs/head/day • ${ingredient.costPerLb.toFixed(3)}/lb
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{ingredient.percentage.toFixed(1)}%</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(ingredient.amountLbs * ingredient.costPerLb).toFixed(3)}/head
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total per Head per Day</span>
                    <span className="text-lg font-bold">{ration.totalLbsPerHead.toFixed(2)} lbs</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nutritional Analysis */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Nutritional Analysis</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crude Protein</p>
                  <p className="text-xl font-bold">{ration.kpis.crudeProtein.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TDN</p>
                  <p className="text-xl font-bold">{ration.kpis.totalDigestibleNutrients.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NE Maintenance</p>
                  <p className="text-xl font-bold">{ration.kpis.netEnergyMaintenance.toFixed(2)} Mcal/lb</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NE Gain</p>
                  <p className="text-xl font-bold">{ration.kpis.netEnergyGain.toFixed(2)} Mcal/lb</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target ADG</p>
                  <p className="text-xl font-bold">{ration.kpis.targetADG.toFixed(2)} lbs/day</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Feed:Gain</p>
                  <p className="text-xl font-bold">{ration.kpis.targetFeedConversion.toFixed(2)}:1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Usage Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pens Using</p>
                  <p className="text-xl font-bold">{stats.pensUsing}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Head Count</p>
                  <p className="text-xl font-bold">{stats.totalHeadCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                  <p className="text-xl font-bold">{stats.activeAssignments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Historical Uses</p>
                  <p className="text-xl font-bold">{stats.historicalAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          {stats.activeAssignments.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Current Pen Assignments</h3>
                <div className="space-y-2">
                  {stats.activeAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{assignment.penName}</p>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(assignment.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{assignment.headCount} head</p>
                        <p className="text-sm text-muted-foreground">
                          ${(ration.kpis.costPerHead * assignment.headCount).toFixed(2)}/day
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {ration.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{ration.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
