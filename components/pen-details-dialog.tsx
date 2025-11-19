"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { firebaseDataStore as dataStore, type Cattle } from "@/lib/data-store-firebase"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import { useCostCalculator } from "@/hooks/use-cost-calculator"
import { useRationStore } from "@/hooks/use-ration-store"
import { rationCalculator } from "@/lib/ration-calculator"
import { Eye, DollarSign, TrendingUp, TrendingDown, Plus, Activity, Cookie, AlertCircle } from "lucide-react"
import { ActivityLogItem } from "@/components/activity-log-item"

interface PenDetailsDialogProps {
  penId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssignCattle?: () => void
}

export function PenDetailsDialog({ penId, open, onOpenChange, onAssignCattle }: PenDetailsDialogProps) {
  const router = useRouter()
  const { getPen, barns } = usePenStore()
  const { getEntityActivities } = useActivityStore()
  const { calculatePenCosts } = useCostCalculator()
  const { getPenAssignment, activeRations } = useRationStore()

  if (!penId) return null

  const pen = getPen(penId)
  if (!pen) return null

  const barn = barns.find((b) => b.id === pen.barnId)
  const cattle = dataStore.getCattle().filter((c) => c.penId === penId && c.status === "Active")

  // Get current ration assignment
  const rationAssignment = getPenAssignment(penId)
  const currentRation = rationAssignment
    ? activeRations.find(r => r.id === rationAssignment.rationId)
    : null

  // Calculate days remaining for feeds used by this pen
  const penFeedStatus = currentRation
    ? rationCalculator.calculateInventoryStatus().filter(status =>
        currentRation.ingredients.some(ing => ing.feedId === status.feedId)
      )
    : []

  const lowFeedAlerts = penFeedStatus.filter(s => s.status === "low" || s.status === "critical")

  // Use automated cost calculation
  const penCosts = calculatePenCosts(penId)

  // Extract calculated values or use defaults
  const totalInvestment = penCosts?.totalInvestment || 0
  const totalFeedCost = penCosts?.totalFeedCost || 0
  const avgWeightPerHead = penCosts?.averageWeightPerHead || 0
  const currentProfitLoss = penCosts?.totalEstimatedProfit || 0
  const costPerPound = penCosts?.averageBreakEvenLivePrice || 0
  const avgDaysOnFeed = penCosts?.averageDaysOnFeed || 0

  const handleCattleClick = (cattleId: string) => {
    onOpenChange(false)
    router.push(`/cattle/${cattleId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {pen.name}
                <Badge variant="outline">{barn?.name}</Badge>
              </DialogTitle>
              <DialogDescription>
                {cattle.length} / {pen.capacity} head ({((cattle.length / pen.capacity) * 100).toFixed(0)}% capacity)
              </DialogDescription>
            </div>
            {onAssignCattle && (
              <Button size="sm" onClick={onAssignCattle}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cattle
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pen Analytics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Investment</p>
                  <p className="text-lg font-bold">${totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Feed Cost</p>
                  <p className="text-lg font-bold">${totalFeedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Weight/Head</p>
                  <p className="text-lg font-bold">{avgWeightPerHead.toFixed(0)} lbs</p>
                </div>
              </CardContent>
            </Card>

            <Card className={currentProfitLoss >= 0 ? "border-green-500" : "border-red-500"}>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Profit/Loss</p>
                  <p className={`text-lg font-bold flex items-center gap-1 ${currentProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {currentProfitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    ${Math.abs(currentProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Break-Even Price</p>
                  <p className="text-sm font-semibold">${costPerPound.toFixed(2)}/lb</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Days on Feed</p>
                  <p className="text-sm font-semibold">{avgDaysOnFeed.toFixed(0)} days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Ration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Feed Ration</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  router.push("/rations")
                }}
              >
                {currentRation ? "Change" : "Assign"} Ration
              </Button>
            </div>

            {currentRation ? (
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{currentRation.name}</p>
                        <Badge variant="outline" className="text-xs capitalize mt-1">
                          {currentRation.stage}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {currentRation.totalLbsPerHead.toFixed(2)} lbs/head/day
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${(currentRation.kpis.costPerHead * cattle.length).toFixed(2)}/day
                        </p>
                      </div>
                    </div>

                    {/* Ingredient Breakdown */}
                    <div className="space-y-2 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Ingredients:</p>
                      {currentRation.ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{ingredient.feedName}</span>
                          <span className="font-medium">
                            {ingredient.amountLbs.toFixed(2)} lbs ({ingredient.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Target KPIs */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Target ADG</p>
                        <p className="text-sm font-semibold">{currentRation.kpis.targetADG.toFixed(2)} lbs</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Feed:Gain</p>
                        <p className="text-sm font-semibold">{currentRation.kpis.targetFeedConversion.toFixed(2)}:1</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Low Feed Alerts */}
                {lowFeedAlerts.length > 0 && (
                  <Card className="border-amber-500">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-600">Low Feed Inventory</p>
                      </div>
                      <div className="space-y-2">
                        {lowFeedAlerts.map((alert) => (
                          <div key={alert.feedId} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{alert.feedName}</span>
                            <Badge variant={alert.status === "critical" ? "destructive" : "default"} className="text-xs">
                              {alert.daysRemaining.toFixed(1)} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <Cookie className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No ration assigned to this pen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assign a ration to track feed consumption and performance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cattle List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Cattle in this Pen</h3>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-3 space-y-2">
                {cattle.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No cattle in this pen
                  </p>
                ) : (
                  cattle.map((animal) => {
                    const currentWeight = animal.weights?.[animal.weights.length - 1]?.weight || Number(animal.purchaseWeight) || 0
                    const purchaseWeight = Number(animal.purchaseWeight) || 0
                    const weightGain = currentWeight - purchaseWeight

                    return (
                      <div
                        key={animal.id}
                        onClick={() => handleCattleClick(animal.id)}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Tag #{animal.tagNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {animal.breed}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {animal.sex}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {animal.stage}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right mr-3">
                          <p className="text-sm font-semibold">{currentWeight.toFixed(0)} lbs</p>
                          {weightGain > 0 && (
                            <p className="text-xs text-green-600">+{weightGain.toFixed(0)} lbs</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Recent Activities */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Recent Activities</h3>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-3 space-y-2">
                {getEntityActivities("pen", penId, 10).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activities
                  </p>
                ) : (
                  getEntityActivities("pen", penId, 10).map((activity) => (
                    <ActivityLogItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {pen.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Notes:</p>
              <p className="text-sm text-muted-foreground">{pen.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
