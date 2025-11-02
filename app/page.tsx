"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, DollarSign, Plus, Download, Sprout, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { MetricCard } from "@/components/metric-card"
import { QuickEntryDialog } from "@/components/quick-entry-dialog"
import { LifecycleSettingsDialog } from "@/components/lifecycle-settings-dialog"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import Link from "next/link"
import Image from "next/image"
import { dataStore } from "@/lib/data-store"
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
  const router = useRouter()

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
    // Load analytics
    const data = dataStore.getAnalytics()
    setAnalytics(data)

    // Get all cattle data
    const cattle = dataStore.getCattle()
    const activeCattle = cattle.filter((c) => c.status === "Active")

    // Calculate stage counts
    const counts: Record<string, number> = {}
    activeCattle.forEach((c) => {
      counts[c.stage] = (counts[c.stage] || 0) + 1
    })
    setStageCounts(counts)

    // Generate alerts
    const feed = dataStore.getFeedInventory()
    const newAlerts = []

    // Feed inventory alerts
    feed.forEach((f) => {
      const daysRemaining = f.dailyUsage > 0 ? f.quantity / f.dailyUsage : 999
      if (daysRemaining < 7) {
        newAlerts.push({
          id: `feed-${f.id}`,
          severity: daysRemaining < 3 ? "danger" : "warning",
          title: `Low ${f.name} Inventory`,
          description: `${f.name} below 7 days supply`,
          metric: `${Math.floor(daysRemaining)} days remaining`,
        })
      }
    })

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
    if (healthyCattle.length === cattle.filter((c) => c.status === "Active").length) {
      newAlerts.push({
        id: "health-good",
        severity: "success",
        title: "Cattle Health Good",
        description: "All cattle healthy",
        metric: `${healthyCattle.length} head`,
      })
    }

    setAlerts(newAlerts)
  }, [])

  const handleExportCattle = () => {
    const cattle = dataStore.getCattle()
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
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Comprehensive herd overview</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportCattle} className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <QuickEntryDialog />
              <Link href="/cattle">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Cattle</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Production Lifecycle */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Production Lifecycle</h2>
            <LifecycleSettingsDialog />
          </div>
          <Card>
            <CardContent className="p-4 sm:p-8">
              {stages.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center">
                      {stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center gap-2 sm:gap-4">
                          <SortableStage
                            stage={stage}
                            count={stageCounts[stage.name] || 0}
                            onClick={() => router.push(`/cattle?stage=${encodeURIComponent(stage.name)}`)}
                          />

                          {index < stages.length - 1 && (
                            <svg
                              className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0 hidden sm:block"
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

        {/* Herd Overview */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Herd Overview</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.bulls.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Bulls</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.bulls.herdSires} herd sires</p>
                      <p>{analytics.bulls.herdSireProspects} prospects</p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/bull.png" alt="Bull" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.cows.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Cows</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.cows.pregnant} pregnant</p>
                      <p>
                        {analytics.cows.open} open, {analytics.cows.exposed} exposed
                      </p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/cow.png" alt="Cow" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.calves.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Calves</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.calves.unweaned} unweaned</p>
                      <p>{analytics.calves.weaned} weaned</p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/calf.png" alt="Calf" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Quick Actions */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Link href="/cattle">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Manage Cattle</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">View & edit herd</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/feed">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Sprout className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Feed Inventory</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Track feed levels</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/pastures">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Pastures</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage grazing</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Reports</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Generate reports</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
