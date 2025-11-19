"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, DollarSign, Plus, Download, Sprout, MapPin, FileText, Utensils, MessageSquare, Loader2, Pill, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { MetricCard } from "@/components/metric-card"
import { LifecycleSettingsDialog } from "@/components/lifecycle-settings-dialog"
import { FeedMetricsCard } from "@/components/feed-metrics-card"
import { PenUtilizationCard } from "@/components/pen-utilization-card"
import { QuickAddFeedDialog } from "@/components/quick-add-feed-dialog"
import { QuickAddMedsDialog } from "@/components/quick-add-meds-dialog"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import { useAuth } from "@/contexts/auth-context"
import { useAnalyticsCache } from "@/hooks/use-analytics-cache"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { exportToCSV, generateCattleReport } from "@/lib/export-utils"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-all active:scale-95 cursor-pointer group min-w-[130px] sm:min-w-[170px] touch-manipulation"
      >
        <div
          {...attributes}
          {...listeners}
          className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3 cursor-move touch-none"
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
              className="w-full h-full rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${stage.color}20`, border: `3px solid ${stage.color}` }}
            >
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground text-base sm:text-lg">{stage.name}</h3>
        <p className="text-sm sm:text-base text-muted-foreground font-medium">{count} head</p>
        {stage.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 hidden sm:block line-clamp-1">
            {stage.description}
          </p>
        )}
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const { stages, reorderStages, loading: stagesLoading } = useLifecycleConfig()
  const { isSetupCompleted, cattlePricePerLb, targetDailyGain, updateGrowth } = useFarmSettings()
  const { analytics, loading: analyticsLoading, refreshData } = useAnalyticsCache(cattlePricePerLb)
  const router = useRouter()
  const { toast } = useToast()
  const [isQuickFeedOpen, setIsQuickFeedOpen] = useState(false)
  const [isQuickMedsOpen, setIsQuickMedsOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [newTargetDailyGain, setNewTargetDailyGain] = useState<string>(targetDailyGain.toString())

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
    // Only load data when user is authenticated
    if (!user || authLoading) {
      return
    }

    const loadData = async () => {
      try {
        // Refresh analytics (bypass cache to get latest data)
        const data = await refreshData()

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
      }
    }

    // Subscribe to data changes
    const unsubscribe = firebaseDataStore.subscribe(() => {
      loadData()
    })

    return () => {
      unsubscribe()
    }
  }, [user, authLoading, refreshData])

  const handleExportCattle = async () => {
    const cattle = await firebaseDataStore.getCattle()
    const report = generateCattleReport(cattle)
    exportToCSV(report, "cattle-inventory")
  }

  const handleUpdateTargetDailyGain = async () => {
    const value = parseFloat(newTargetDailyGain)
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid positive number for target daily gain.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateGrowth({ targetDailyGain: value })
      setIsSettingsDialogOpen(false)
      toast({
        title: "Settings updated",
        description: `Target daily gain set to ${value} lbs/day.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update target daily gain.",
        variant: "destructive",
      })
    }
  }

  // Update local state when targetDailyGain changes
  useEffect(() => {
    setNewTargetDailyGain(targetDailyGain.toString())
  }, [targetDailyGain])

  // Show loading state while waiting for auth or data
  if (authLoading || analyticsLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Loading your farm dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {analyticsLoading ? "Using cached data where available..." : "This may take a moment"}
          </p>
        </div>
      </div>
    )
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
      trend: analytics.avgDailyGain > targetDailyGain ? "up" : "neutral",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static lg:top-0">
        <div className="w-full px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
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
                <Button variant="outline" size="sm" className="touch-manipulation min-h-[48px] px-3 sm:px-4 active:scale-95 transition-transform">
                  <MessageSquare className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Farm Assistant</span>
                  <span className="sm:hidden sr-only">AI</span>
                </Button>
              </Link>
              <Link href="/cattle">
                <Button size="sm" className="touch-manipulation min-h-[48px] px-4 sm:px-5 active:scale-95 transition-transform">
                  <Plus className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Cattle</span>
                  <span className="sm:hidden sr-only">Add</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        {/* Production Lifecycle */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Production Lifecycle</h2>
            <LifecycleSettingsDialog />
          </div>
          <Card>
            <CardContent className="p-4 sm:p-6 overflow-x-auto mobile-scroll-container">
              {stages.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-3 sm:gap-6 justify-start sm:justify-center items-center min-w-min pb-2">
                      {stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                          <SortableStage
                            stage={stage}
                            count={stageCounts[stage.name] || 0}
                            onClick={() => router.push(`/cattle?stage=${encodeURIComponent(stage.name)}`)}
                          />

                          {index < stages.length - 1 && (
                            <svg
                              className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
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
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4 text-base">No lifecycle stages configured</p>
                  <LifecycleSettingsDialog />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Quick Add Feed & Meds */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-foreground">Quick Actions</h2>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
            <Card
              className="hover:bg-muted/50 active:bg-muted active:scale-[0.99] transition-all cursor-pointer h-full touch-manipulation"
              onClick={() => setIsQuickFeedOpen(true)}
            >
              <CardContent className="p-6 sm:p-7 text-center min-h-[150px] flex flex-col items-center justify-center">
                <Utensils className="h-12 w-12 sm:h-14 sm:w-14 mx-auto mb-3 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg sm:text-xl mb-2">Quick Add Feed</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Quickly allocate feed to a pen</p>
              </CardContent>
            </Card>
            <Card
              className="hover:bg-muted/50 active:bg-muted active:scale-[0.99] transition-all cursor-pointer h-full touch-manipulation"
              onClick={() => setIsQuickMedsOpen(true)}
            >
              <CardContent className="p-6 sm:p-7 text-center min-h-[150px] flex flex-col items-center justify-center">
                <Pill className="h-12 w-12 sm:h-14 sm:w-14 mx-auto mb-3 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg sm:text-xl mb-2">Quick Add Meds</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Quickly administer medication to a pen</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Metrics */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Key Metrics</h2>
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-h-[44px] touch-manipulation">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Growth Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Growth Target Settings</DialogTitle>
                  <DialogDescription>
                    Configure your target average daily gain. This value is used as a benchmark for growth performance and projections when actual ADG data is not available.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-daily-gain">Target Daily Gain (lbs/day)</Label>
                    <Input
                      id="target-daily-gain"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={newTargetDailyGain}
                      onChange={(e) => setNewTargetDailyGain(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {targetDailyGain} lbs/day. Typical range: 1.5 - 4.0 lbs/day depending on cattle type and feed program.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateTargetDailyGain}>
                      Save Settings
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </section>

        {/* Feed & Pen Management */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-foreground">Operations Overview</h2>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-2">
            <FeedMetricsCard />
            <PenUtilizationCard />
          </div>
        </section>

        {/* Management Links */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-foreground">Management</h2>
          <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
            <Link href="/cattle" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted active:scale-[0.98] transition-all cursor-pointer h-full">
                <CardContent className="p-5 sm:p-7 text-center min-h-[120px] flex flex-col items-center justify-center">
                  <Package className="h-9 w-9 sm:h-10 sm:w-10 mx-auto mb-2.5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg">Manage Cattle</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden md:block mt-1.5">View & edit herd</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/rations" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted active:scale-[0.98] transition-all cursor-pointer h-full">
                <CardContent className="p-5 sm:p-7 text-center min-h-[120px] flex flex-col items-center justify-center">
                  <Utensils className="h-9 w-9 sm:h-10 sm:w-10 mx-auto mb-2.5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg">Rations</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden md:block mt-1.5">Manage feed rations</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/inventory" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted active:scale-[0.98] transition-all cursor-pointer h-full">
                <CardContent className="p-5 sm:p-7 text-center min-h-[120px] flex flex-col items-center justify-center">
                  <Sprout className="h-9 w-9 sm:h-10 sm:w-10 mx-auto mb-2.5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg">Inventory</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden md:block mt-1.5">Manage supplies</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/costs" className="touch-manipulation">
              <Card className="hover:bg-muted/50 active:bg-muted active:scale-[0.98] transition-all cursor-pointer h-full">
                <CardContent className="p-5 sm:p-7 text-center min-h-[120px] flex flex-col items-center justify-center">
                  <DollarSign className="h-9 w-9 sm:h-10 sm:w-10 mx-auto mb-2.5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg">Financial</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden md:block mt-1.5">View costs</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      {/* Quick Add Dialogs */}
      <QuickAddFeedDialog open={isQuickFeedOpen} onOpenChange={setIsQuickFeedOpen} />
      <QuickAddMedsDialog open={isQuickMedsOpen} onOpenChange={setIsQuickMedsOpen} />
    </div>
  )
}
