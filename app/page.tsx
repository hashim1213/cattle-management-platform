"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, DollarSign, Plus, Download, Sprout, MapPin, FileText, Heart, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { MetricCard } from "@/components/metric-card"
import { LifecycleSettingsDialog } from "@/components/lifecycle-settings-dialog"
import { FeedMetricsCard } from "@/components/feed-metrics-card"
import { PenUtilizationCard } from "@/components/pen-utilization-card"
import { PenOverviewCard } from "@/components/pen-overview-card"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import Link from "next/link"
import Image from "next/image"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { exportToCSV, generateCattleReport } from "@/lib/export-utils"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableStage({
  stage,
  count,
  onClick,
}: {
  stage: any
  count: number
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 sm:gap-4">
      <button
        onClick={onClick}
        className="flex flex-col items-center text-center p-3 sm:p-4 rounded-lg hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer group min-w-[120px] sm:min-w-[160px]"
      >
        <div
          {...attributes}
          {...listeners}
          className="relative w-20 h-20 sm:w-28 sm:h-28 mb-2 cursor-move touch-none"
        >
          {stage.image ? (
            <Image
              src={stage.image}
              alt={stage.name}
              fill
              className="object-contain group-hover:scale-110 transition-transform"
            />
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${stage.color}20`, border: `2px solid ${stage.color}` }}
            >
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground text-sm sm:text-base">{stage.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{count} head</p>
        {stage.description && (
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block line-clamp-1">
            {stage.description}
          </p>
        )}
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const { stages, reorderStages } = useLifecycleConfig()
  const { isSetupCompleted, cattlePricePerLb } = useFarmSettings()
  const router = useRouter()

  // Onboarding disabled for now - users go straight to dashboard
  // useEffect(() => {
  //   if (!isSetupCompleted) {
  //     router.push("/onboarding")
  //   }
  // }, [isSetupCompleted, router])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id)
      const newIndex = stages.findIndex((s) => s.id === over.id)

      const newOrder = arrayMove(stages, oldIndex, newIndex)
      reorderStages(newOrder.map((s) => s.id))
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load analytics with configurable market price
        const data = await firebaseDataStore.getAnalytics(cattlePricePerLb)
        setAnalytics(data)

        // Get all cattle data
        const cattle = await firebaseDataStore.getCattle()
        const activeCattle = cattle.filter((c) => c.status === "Active")

        // Calculate stage counts
        const counts: Record<string, number> = {}
        activeCattle.forEach((c) => {
          counts[c.stage] = (counts[c.stage] || 0) + 1
        })
        setStageCounts(counts)

        // Generate alerts
        const newAlerts = []

        // Cost of gain alert
        if (data.costPerHead > 1800) {
          newAlerts.push({
            id: "cost-high",
            severity: "warning",
            title: "High Cost Per Head",
            description: "Current cost exceeds target",
            metric: `$${data.costPerHead.toFixed(0)}`,
          })
        }

        // Health status alert
        const healthyCattle = cattle.filter((c) => c.healthStatus === "Healthy" && c.status === "Active")
        if (healthyCattle.length > 0 && healthyCattle.length === cattle.filter((c) => c.status === "Active").length) {
          newAlerts.push({
            id: "health-good",
            severity: "success",
            title: "Cattle Health Good",
            description: "All cattle healthy",
            metric: `${healthyCattle.length} head`,
          })
        }

        setAlerts(newAlerts)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
        setAnalytics({
          totalCattle: 0,
          activeCattle: 0,
          healthyCount: 0,
          sickCount: 0,
          avgWeight: 0,
          avgDailyGain: 0,
          totalValue: 0,
          totalInventoryValue: 0,
          costPerHead: 0,
          bulls: { count: 0, herdSires: 0, herdSireProspects: 0 },
          cows: { count: 0, pregnant: 0, open: 0, exposed: 0 },
          calves: { count: 0, unweaned: 0, weaned: 0 },
        })
      }
    }

    loadData()
  }, [cattlePricePerLb])

  const handleExportCattle = async () => {
    const cattle = await firebaseDataStore.getCattle()
    const report = generateCattleReport(cattle)
    exportToCSV(report, "cattle-inventory")
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const metrics = [
    {
      title: "Total Cattle",
      value: analytics.totalCattle.toString(),
      change: "Active herd",
      trend: "neutral" as const,
      icon: Package,
    },
    {
      title: "Inventory Value",
      value: `$${analytics.totalInventoryValue.toLocaleString()}`,
      change: "Current market value",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Avg Cost Per Head",
      value: `$${analytics.costPerHead.toFixed(0)}`,
      change: "Total costs / head",
      trend: analytics.costPerHead > 1800 ? "up" : "neutral",
      icon: DollarSign,
    },
    {
      title: "Avg Daily Gain",
      value: `${analytics.avgDailyGain.toFixed(1)} lbs`,
      change: "30-day average",
      trend: analytics.avgDailyGain > 2.5 ? "up" : "neutral",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Dashboard</h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCattle}
                className="hidden md:flex touch-manipulation min-h-[44px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Link href="/agent">
                <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] px-3 sm:px-4">
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Farm Assistant</span>
                  <span className="sm:hidden">AI</span>
                </Button>
              </Link>
              <Link href="/cattle">
                <Button size="sm" className="touch-manipulation min-h-[44px] px-3 sm:px-4">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Cattle</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-safe">
        {/* Production Lifecycle */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Production Lifecycle</h2>
            <LifecycleSettingsDialog />
          </div>
          <Card>
            <CardContent className="p-3 sm:p-6 overflow-x-auto">
              {stages.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-2 sm:gap-4 justify-start sm:justify-center items-center min-w-min pb-2">
                      {stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                          <SortableStage
                            stage={stage}
                            count={stageCounts[stage.name] || 0}
                            onClick={() => router.push(`/cattle?stage=${encodeURIComponent(stage.name)}`)}
                          />

                          {index < stages.length - 1 && (
                            <svg
                              className="w-3 h-3 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No lifecycle stages configured</p>
                  <LifecycleSettingsDialog />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Pen Overview */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Pen Overview</h2>
          <PenOverviewCard />
        </section>

        {/* Alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Status Alerts</h2>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} />
              ))}
            </div>
          </section>
        )}

        {/* Key Metrics */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Key Metrics</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </section>

        {/* Feed & Pen Management */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Operations Overview</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            <FeedMetricsCard />
            <PenUtilizationCard />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Link href="/cattle" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 text-center min-h-[100px] flex flex-col items-center justify-center">
                  <Package className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Manage Cattle</h3>
                  <p className="text-xs text-muted-foreground hidden md:block mt-1">View & edit herd</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/health" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 text-center min-h-[100px] flex flex-col items-center justify-center">
                  <Heart className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Health</h3>
                  <p className="text-xs text-muted-foreground hidden md:block mt-1">Track health records</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/inventory" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 text-center min-h-[100px] flex flex-col items-center justify-center">
                  <Sprout className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Inventory</h3>
                  <p className="text-xs text-muted-foreground hidden md:block mt-1">Manage supplies</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/costs" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 text-center min-h-[100px] flex flex-col items-center justify-center">
                  <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Financial</h3>
                  <p className="text-xs text-muted-foreground hidden md:block mt-1">View costs</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
