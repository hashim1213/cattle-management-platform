"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Wheat, Grid3x3, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { PenFeedDialog } from "@/components/pen-feed-dialog"
import { Progress } from "@/components/ui/progress"
import type { Pen } from "@/lib/pen-store-firebase"

interface PenWithCattle extends Pen {
  cattle: Cattle[]
}

export default function PenManagePage() {
  const { user, loading: authLoading } = useAuth()
  const [pensWithCattle, setPensWithCattle] = useState<PenWithCattle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPen, setSelectedPen] = useState<Pen | null>(null)
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"all" | "occupied" | "empty">("occupied")

  const loadData = async () => {
    try {
      await firebasePenStore.loadPens()
      const pens = firebasePenStore.getPens()
      const allCattle = await firebaseDataStore.getCattle()
      const activeCattle = allCattle.filter(c => c.status === "Active")

      // Group cattle by pen
      const pensWithCattleData: PenWithCattle[] = pens.map(pen => ({
        ...pen,
        cattle: activeCattle.filter(c => c.penId === pen.id)
      }))

      setPensWithCattle(pensWithCattleData)
    } catch (error) {
      console.error("Error loading data:", error)
      setPensWithCattle([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadData()

      // Subscribe to store changes
      const unsubscribe = firebasePenStore.subscribe(loadData)
      return () => unsubscribe()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user])

  const handleFeedPen = (pen: Pen) => {
    setSelectedPen(pen)
    setIsFeedDialogOpen(true)
  }

  const filteredPens = pensWithCattle.filter(pen => {
    if (viewMode === "occupied") return pen.cattle.length > 0
    if (viewMode === "empty") return pen.cattle.length === 0
    return true
  })

  const totalCattle = pensWithCattle.reduce((sum, pen) => sum + pen.cattle.length, 0)
  const totalCapacity = pensWithCattle.reduce((sum, pen) => sum + pen.capacity, 0)
  const overallUtilization = totalCapacity > 0 ? (totalCattle / totalCapacity) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href="/pens" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block touch-manipulation">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Back to Pens
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Pen Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {totalCattle} head across {pensWithCattle.length} pens ({overallUtilization.toFixed(0)}% utilization)
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/pens">
                <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] px-3 sm:px-4">
                  <Plus className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Pen</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* View Mode Filters */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setViewMode("all")}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Pens ({pensWithCattle.length})
            </button>
            <button
              onClick={() => setViewMode("occupied")}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "occupied"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Occupied ({pensWithCattle.filter(p => p.cattle.length > 0).length})
            </button>
            <button
              onClick={() => setViewMode("empty")}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "empty"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Empty ({pensWithCattle.filter(p => p.cattle.length === 0).length})
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 pb-safe">
        {loading ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center">
              <p className="text-muted-foreground">Loading pens...</p>
            </CardContent>
          </Card>
        ) : filteredPens.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {viewMode === "empty" ? "No Empty Pens" : viewMode === "occupied" ? "No Occupied Pens" : "No Pens Yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {viewMode === "all" ? "Create your first pen to start managing cattle" : "Change the filter to see other pens"}
              </p>
              {viewMode === "all" && (
                <Link href="/pens">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pen
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPens.map((pen) => {
              const utilizationRate = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
              const totalWeight = pen.cattle.reduce((sum, c) => sum + c.weight, 0)
              const avgWeight = pen.cattle.length > 0 ? totalWeight / pen.cattle.length : 0

              return (
                <Card key={pen.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Link href={`/pens/${pen.id}`}>
                          <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer truncate">
                            {pen.name}
                          </CardTitle>
                        </Link>
                        <CardDescription className="mt-1">
                          {pen.cattle.length} of {pen.capacity} head
                        </CardDescription>
                      </div>
                      <Badge
                        variant={utilizationRate > 90 ? "destructive" : utilizationRate > 70 ? "default" : "secondary"}
                        className="ml-2 flex-shrink-0"
                      >
                        {utilizationRate.toFixed(0)}%
                      </Badge>
                    </div>

                    {/* Utilization Bar */}
                    <Progress value={utilizationRate} className="h-2 mt-2" />
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Avg Weight</p>
                        <p className="font-semibold">{avgWeight.toFixed(0)} lbs</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Total Weight</p>
                        <p className="font-semibold">{(totalWeight / 2000).toFixed(2)} tons</p>
                      </div>
                    </div>

                    {/* Alert if overfull */}
                    {pen.currentCount > pen.capacity && (
                      <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">Over capacity by {pen.currentCount - pen.capacity} head</p>
                      </div>
                    )}

                    {/* Cattle List */}
                    {pen.cattle.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Cattle in Pen</p>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                          {pen.cattle.map((cattle) => (
                            <Link
                              key={cattle.id}
                              href={`/cattle/${cattle.id}`}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                                  #{cattle.tagNumber}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {cattle.breed}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{cattle.weight}lb</span>
                                <Badge
                                  variant={cattle.healthStatus === "Healthy" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {cattle.healthStatus === "Healthy" ? "✓" : "!"}
                                </Badge>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No cattle in this pen
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedPen(pen)}
                        disabled={pen.cattle.length === 0}
                        className="flex-1 touch-manipulation min-h-[40px]"
                      >
                        <Wheat className="h-4 w-4 mr-2" />
                        Feed
                      </Button>
                      <Link href={`/pens/${pen.id}`} className="flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full touch-manipulation min-h-[40px]"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Feed Dialog */}
      {selectedPen && (
        <PenFeedDialog
          open={isFeedDialogOpen}
          onOpenChange={setIsFeedDialogOpen}
          pen={selectedPen}
          onSuccess={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}
