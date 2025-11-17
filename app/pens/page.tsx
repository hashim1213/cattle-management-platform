"use client"

import { useState, useEffect } from "react"
import { Plus, Warehouse, Grid3x3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { AddBarnDialog } from "@/components/add-barn-dialog"
import { AddPenDialog } from "@/components/add-pen-dialog"
import { PenCard } from "@/components/pen-card"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import type { Barn, Pen } from "@/lib/pen-store-firebase"

export default function PensPage() {
  const { user, loading: authLoading } = useAuth()
  const [barns, setBarns] = useState<Barn[]>([])
  const [pens, setPens] = useState<Pen[]>([])
  const [isAddBarnOpen, setIsAddBarnOpen] = useState(false)
  const [isAddPenOpen, setIsAddPenOpen] = useState(false)
  const [selectedBarnId, setSelectedBarnId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      await firebasePenStore.loadBarns()
      await firebasePenStore.loadPens()
      setBarns(firebasePenStore.getBarns())
      setPens(firebasePenStore.getPens())
    } catch (error) {
      console.error("Error loading data:", error)
      setBarns([])
      setPens([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)

    // Only load data once auth is ready
    if (!authLoading && user) {
      loadData()

      // Subscribe to store changes
      const unsubscribe = firebasePenStore.subscribe(() => {
        setBarns(firebasePenStore.getBarns())
        setPens(firebasePenStore.getPens())
      })

      return () => unsubscribe()
    } else if (!authLoading && !user) {
      // Auth is ready but no user is logged in
      setLoading(false)
    }
  }, [authLoading, user])

  const analytics = mounted ? firebasePenStore.getPenAnalytics() : {
    totalPens: 0,
    totalCapacity: 0,
    totalOccupied: 0,
    utilizationRate: 0,
  }

  const getPens = (barnId: string) => pens.filter(p => p.barnId === barnId)
  const getPenAnalytics = (barnId: string) => firebasePenStore.getPenAnalytics(barnId)

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block touch-manipulation">
                ← Back
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Pens & Barns</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Organize cattle by location and track pen capacity</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddBarnOpen(true)}
                className="touch-manipulation min-h-[44px] px-2 sm:px-4"
              >
                <Warehouse className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Barn</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddPenOpen(true)}
                className="touch-manipulation min-h-[44px] px-3 sm:px-4"
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Add Pen</span>
                <span className="sm:hidden">Pen</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 pb-safe">
        {loading ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Barns</CardDescription>
              <CardTitle className="text-3xl" suppressHydrationWarning>{mounted ? barns.length : 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Pens</CardDescription>
              <CardTitle className="text-3xl" suppressHydrationWarning>{analytics.totalPens}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Capacity</CardDescription>
              <CardTitle className="text-3xl" suppressHydrationWarning>{analytics.totalCapacity}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Utilization Rate</CardDescription>
              <CardTitle className="text-3xl" suppressHydrationWarning>{analytics.utilizationRate.toFixed(0)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Barns and Pens */}
        {mounted && barns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Barns Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first barn to start managing pens
              </p>
              <Button onClick={() => setIsAddBarnOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Barn
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {barns.map((barn) => {
              const barnPens = getPens(barn.id)
              const barnAnalytics = getPenAnalytics(barn.id)

              return (
                <Card key={barn.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Warehouse className="h-5 w-5" />
                          {barn.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {barn.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={barnAnalytics.utilizationRate > 80 ? "destructive" : "default"}>
                          {barnAnalytics.totalOccupied} / {barnAnalytics.totalCapacity} ({barnAnalytics.utilizationRate.toFixed(0)}%)
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {barnPens.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Grid3x3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pens in this barn</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setSelectedBarnId(barn.id)
                            setIsAddPenOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Pen
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {barnPens.map((pen) => (
                          <PenCard key={pen.id} pen={pen} barn={barn} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
          </>
        )}
      </main>

      {/* Dialogs */}
      <AddBarnDialog open={isAddBarnOpen} onOpenChange={setIsAddBarnOpen} />
      <AddPenDialog
        open={isAddPenOpen}
        onOpenChange={(open) => {
          setIsAddPenOpen(open)
          if (!open) setSelectedBarnId(null)
        }}
        defaultBarnId={selectedBarnId || undefined}
      />
    </div>
  )
}
