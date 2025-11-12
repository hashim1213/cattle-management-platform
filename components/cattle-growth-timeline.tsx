"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Target,
  DollarSign,
  Activity,
  Wheat,
  ArrowUpRight,
  Info,
} from "lucide-react"
import { Cattle, WeightRecord } from "@/lib/data-store-firebase"
import { FeedAllocationRecord } from "@/lib/feed/feed-service"
import {
  growthTrackingService,
  CattleGrowthMetrics,
  GrowthTimeline,
} from "@/lib/growth-tracking-service"

interface CattleGrowthTimelineProps {
  cattle: Cattle
  weightRecords: WeightRecord[]
  feedAllocations: FeedAllocationRecord[]
  targetWeight?: number
}

export function CattleGrowthTimeline({
  cattle,
  weightRecords,
  feedAllocations,
  targetWeight = 1200, // Default market weight
}: CattleGrowthTimelineProps) {
  const [metrics, setMetrics] = useState<CattleGrowthMetrics | null>(null)

  useEffect(() => {
    const calculated = growthTrackingService.getCattleGrowthMetrics(
      cattle,
      weightRecords,
      feedAllocations,
      targetWeight
    )
    setMetrics(calculated)
  }, [cattle, weightRecords, feedAllocations, targetWeight])

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading growth metrics...
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getADGBadge = (adg: number | undefined) => {
    if (!adg) return null
    if (adg > 3) return <Badge className="bg-green-500">Excellent ({adg.toFixed(2)} lbs/day)</Badge>
    if (adg > 2) return <Badge className="bg-blue-500">Good ({adg.toFixed(2)} lbs/day)</Badge>
    if (adg > 1) return <Badge variant="secondary">Fair ({adg.toFixed(2)} lbs/day)</Badge>
    return <Badge variant="destructive">Low ({adg.toFixed(2)} lbs/day)</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Current Weight</span>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentWeight} lbs</div>
            {weightRecords.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Last measured: {formatDate(weightRecords[weightRecords.length - 1].date)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current ADG */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Current ADG</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.currentADG ? `${metrics.currentADG.adg.toFixed(2)}` : "N/A"}
              {metrics.currentADG && <span className="text-sm font-normal"> lbs/day</span>}
            </div>
            {metrics.currentADG && (
              <div className="mt-2">{getADGBadge(metrics.currentADG.adg)}</div>
            )}
          </CardContent>
        </Card>

        {/* Days to Target */}
        {metrics.daysToMarket && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Days to {targetWeight} lbs</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.daysToMarket.daysRemaining > 0
                  ? `${metrics.daysToMarket.daysRemaining} days`
                  : "At target"}
              </div>
              {metrics.daysToMarket.estimatedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Est: {formatDate(metrics.daysToMarket.estimatedDate)}
                </p>
              )}
              {!metrics.daysToMarket.feasible && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  Adjust ADG needed
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feed Efficiency */}
        {metrics.feedEfficiency && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Feed Conversion</span>
                <Wheat className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.feedEfficiency.feedConversionRatio.toFixed(1)}:1
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${metrics.feedEfficiency.costPerLbGain.toFixed(2)}/lb gain
              </p>
              {metrics.feedEfficiency.feedConversionRatio < 6 && (
                <Badge className="mt-2 text-xs bg-green-500">Efficient</Badge>
              )}
              {metrics.feedEfficiency.feedConversionRatio > 8 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  Review feed
                </Badge>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="adg">ADG Analysis</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Growth & Feed Timeline</CardTitle>
              <CardDescription>
                Historical weight measurements and feed allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No timeline data available</p>
                  <p className="text-sm mt-2">
                    Add weight records and feed allocations to track growth
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.timeline
                    .filter(item => item.type !== "projection")
                    .reverse()
                    .slice(0, 20)
                    .map((item, idx) => (
                      <TimelineItem key={idx} item={item} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight Projections</CardTitle>
              <CardDescription>
                Estimated future weights based on current ADG of{" "}
                {metrics.currentADG?.adg.toFixed(2) || metrics.lifetimeADG?.adg.toFixed(2) || "2.50"}{" "}
                lbs/day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.projections.map((proj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {formatDate(proj.projectionDate)} ({proj.daysFromNow} days)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Projected Weight: {proj.projectedWeight} lbs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        +{(proj.projectedWeight - metrics.currentWeight).toFixed(0)} lbs
                      </div>
                      <div className="text-xs text-muted-foreground">Expected gain</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADG Analysis Tab */}
        <TabsContent value="adg" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Daily Gain Analysis</CardTitle>
              <CardDescription>
                Performance metrics across different time periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lifetime ADG */}
              {metrics.lifetimeADG && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Lifetime ADG</h3>
                    {getADGBadge(metrics.lifetimeADG.adg)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Period</div>
                      <div className="font-medium">
                        {formatDate(metrics.lifetimeADG.startDate)} -{" "}
                        {formatDate(metrics.lifetimeADG.endDate)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {metrics.lifetimeADG.days} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weight Change</div>
                      <div className="font-medium">
                        {metrics.lifetimeADG.startWeight} → {metrics.lifetimeADG.endWeight} lbs
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        +{(metrics.lifetimeADG.endWeight - metrics.lifetimeADG.startWeight).toFixed(0)}{" "}
                        lbs total
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Last 30 Days ADG */}
              {metrics.last30DaysADG && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Last 30 Days ADG</h3>
                    {getADGBadge(metrics.last30DaysADG.adg)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Period</div>
                      <div className="font-medium">
                        {formatDate(metrics.last30DaysADG.startDate)} -{" "}
                        {formatDate(metrics.last30DaysADG.endDate)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {metrics.last30DaysADG.days} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weight Change</div>
                      <div className="font-medium">
                        {metrics.last30DaysADG.startWeight} → {metrics.last30DaysADG.endWeight} lbs
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        +
                        {(metrics.last30DaysADG.endWeight - metrics.last30DaysADG.startWeight).toFixed(
                          0
                        )}{" "}
                        lbs total
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed Efficiency Detail */}
              {metrics.feedEfficiency && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Feed Efficiency</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Feed</div>
                      <div className="font-medium">{metrics.feedEfficiency.totalFeedLbs} lbs</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weight Gain</div>
                      <div className="font-medium">{metrics.feedEfficiency.weightGainLbs} lbs</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Feed Cost</div>
                      <div className="font-medium">${metrics.feedEfficiency.totalFeedCost}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cost Per Lb Gain</div>
                      <div className="font-medium">${metrics.feedEfficiency.costPerLbGain}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {!metrics.lifetimeADG && !metrics.last30DaysADG && !metrics.feedEfficiency && (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Insufficient data for ADG analysis</p>
                  <p className="text-sm mt-2">
                    Record at least 2 weights to calculate ADG
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Timeline item component
function TimelineItem({ item }: { item: GrowthTimeline }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex items-start gap-4 relative pl-6 border-l-2 border-border pb-4 last:pb-0">
      <div className="absolute left-[-9px] top-2">
        {item.type === "weight" && (
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
        )}
        {item.type === "feed" && (
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
        )}
        {item.type === "projection" && (
          <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-background" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{formatDate(item.date)}</span>
          {item.type === "weight" && <Badge variant="secondary">Weight</Badge>}
          {item.type === "feed" && <Badge variant="secondary">Feed</Badge>}
          {item.type === "projection" && <Badge variant="secondary">Projection</Badge>}
        </div>

        {item.type === "weight" && item.weight && (
          <div className="text-sm">
            <div className="font-semibold text-lg">{item.weight} lbs</div>
            {item.notes && <div className="text-muted-foreground mt-1">{item.notes}</div>}
          </div>
        )}

        {item.type === "feed" && (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-green-600" />
              <span>
                {item.feedPerAnimal} lbs per animal (Total: {item.feedAmount} lbs)
              </span>
            </div>
            {item.notes && <div className="text-muted-foreground">{item.notes}</div>}
          </div>
        )}

        {item.type === "projection" && item.projectedWeight && (
          <div className="text-sm">
            <div className="font-semibold">{item.projectedWeight} lbs (projected)</div>
            {item.notes && <div className="text-muted-foreground mt-1">{item.notes}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
