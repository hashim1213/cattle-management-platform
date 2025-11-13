"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Grid3x3, Wheat, Syringe, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePenStore } from "@/hooks/use-pen-store"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { PenFeedDialog } from "@/components/pen-feed-dialog"
import { PenMedicationDialog } from "@/components/pen-medication-dialog"
import { PenROICard } from "@/components/pen-roi-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function PenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { barns, updatePen, pens, loading: pensLoading } = usePenStore()
  const [pen, setPen] = useState<any>(null)
  const [barn, setBarn] = useState<any>(null)
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [cattleLoading, setCattleLoading] = useState(true)
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [penValue, setPenValue] = useState<string>("")

  // Update pen when pens array changes
  useEffect(() => {
    console.log("[PEN DETAIL] Pens changed, looking for pen:", params.id)
    console.log("[PEN DETAIL] Pens array length:", pens.length)
    const foundPen = pens.find(p => p.id === params.id)
    if (foundPen) {
      console.log("[PEN DETAIL] Found pen:", foundPen.name)
      setPen(foundPen)
      const foundBarn = barns.find(b => b.id === foundPen.barnId)
      setBarn(foundBarn)
    } else if (pens.length > 0) {
      console.warn("[PEN DETAIL] Pen not found in array of", pens.length, "pens")
    }
  }, [pens, barns, params.id])

  // Load cattle and subscribe to real-time updates
  useEffect(() => {
    const loadCattle = async () => {
      try {
        console.log("[PEN DETAIL] Loading cattle for pen:", params.id)
        setCattleLoading(true)
        const allCattle = await firebaseDataStore.getCattle()
        console.log(`[PEN DETAIL] Total cattle loaded: ${allCattle.length}`)
        const penCattle = allCattle.filter(c => c.penId === params.id)
        console.log(`[PEN DETAIL] Cattle in this pen: ${penCattle.length}`)
        setCattle(penCattle)
      } catch (error) {
        console.error("[PEN DETAIL] Error loading cattle:", error)
        setCattle([])
      } finally {
        setCattleLoading(false)
      }
    }

    // Load cattle initially
    loadCattle()

    // Subscribe to cattle updates
    const unsubscribe = firebaseDataStore.subscribe(() => {
      console.log("[PEN DETAIL] Cattle data updated, reloading...")
      loadCattle()
    })

    return () => unsubscribe()
  }, [params.id])

  const loading = pensLoading || (cattleLoading && !pen)

  const handleUpdatePenValue = async () => {
    if (!pen) {
      toast.error("Pen data not loaded")
      return
    }

    try {
      const valueToSet = penValue ? Number(penValue) : undefined
      await updatePen(pen.id, { totalValue: valueToSet })

      setPenValue("")
      setIsValueDialogOpen(false)

      toast.success(
        valueToSet
          ? `Pen value set to $${valueToSet.toFixed(0)}`
          : "Pen value reset to automatic calculation"
      )
    } catch (error) {
      console.error("Failed to update pen value:", error)
      toast.error("Failed to update pen value")
    }
  }

  // Calculate total value from cattle
  const calculatedTotalValue = Array.isArray(cattle) ? cattle.reduce((sum, c) => {
    const marketPricePerPound = 1.65
    const cattleValue = c.currentValue || (c.weight * marketPricePerPound)
    return sum + cattleValue
  }, 0) : 0

  const displayTotalValue = pen?.totalValue ?? calculatedTotalValue

  // Show loading only on initial load
  if (loading && !pen) {
    console.log("[PEN DETAIL] Showing loading screen")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // If pens have loaded but pen not found, show error
  if (!pensLoading && !pen && pens.length > 0) {
    console.log("[PEN DETAIL] Pen not found after loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pen not found</p>
          <Link href="/pens">
            <Button>Back to Pens</Button>
          </Link>
        </div>
      </div>
    )
  }

  // If pen is still null (shouldn't happen), show loading
  if (!pen) {
    console.log("[PEN DETAIL] Pen is null, waiting...")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading pen data...</p>
      </div>
    )
  }

  console.log("[PEN DETAIL] Rendering pen page for:", pen.name)

  const utilizationRate = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
  const available = pen.capacity - pen.currentCount

  return (
    <>
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Link
              href="/pens"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 touch-manipulation inline-flex min-h-[44px] items-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pens
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Grid3x3 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{pen.name}</h1>
                  <Badge
                    variant={utilizationRate > 80 ? "destructive" : utilizationRate > 50 ? "default" : "secondary"}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                  >
                    {utilizationRate.toFixed(0)}% Full
                  </Badge>
                </div>
                {barn && (
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                    {barn.name} • {barn.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Record Feed button clicked")
                    setIsFeedDialogOpen(true)
                  }}
                  className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
                >
                  <Wheat className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="sm:inline">Feed</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Record Meds button clicked")
                    setIsMedicationDialogOpen(true)
                  }}
                  className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
                >
                  <Syringe className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="sm:inline">Meds</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Pen Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Occupied</span>
                    <span className="font-medium">{pen.currentCount} / {pen.capacity}</span>
                  </div>
                  <Progress value={utilizationRate} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">{available} head</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pen ID</span>
                    <span className="font-medium">{pen.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Capacity</span>
                    <span className="font-medium">{pen.capacity} head</span>
                  </div>
                  {pen.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground">Notes:</p>
                      <p className="text-foreground">{pen.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-foreground mb-2">
                      ${displayTotalValue.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pen.totalValue
                        ? "Manual value set"
                        : `Calculated from ${cattle.length} cattle`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log("Update Value button clicked")
                        setPenValue(displayTotalValue.toString())
                        setIsValueDialogOpen(true)
                      }}
                      className="touch-manipulation min-h-[40px] px-4"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <PenROICard pen={pen} estimatedRevenue={displayTotalValue} />
          </div>

          {/* Cattle List */}
          <Card>
            <CardHeader>
              <CardTitle>Cattle in this Pen ({cattle.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cattle.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cattle in this pen yet</p>
                  <p className="text-sm mt-1">Assign cattle to this pen to see them here</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap">Tag Number</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap hidden sm:table-cell">Breed</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap hidden md:table-cell">Sex</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap">Weight</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap hidden lg:table-cell">Stage</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap">Health</th>
                          <th className="text-left px-3 py-3 text-sm font-semibold whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cattle.map((c) => (
                          <tr key={c.id} className="hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <Link
                                href={`/cattle/${c.id}`}
                                className="font-medium text-primary hover:underline touch-manipulation inline-block min-h-[44px] flex items-center"
                              >
                                #{c.tagNumber}
                              </Link>
                            </td>
                            <td className="px-3 py-3 text-sm hidden sm:table-cell">{c.breed}</td>
                            <td className="px-3 py-3 text-sm hidden md:table-cell">{c.sex}</td>
                            <td className="px-3 py-3 text-sm whitespace-nowrap">{c.weight} lbs</td>
                            <td className="px-3 py-3 hidden lg:table-cell">
                              <Badge variant="outline" className="whitespace-nowrap">{c.stage}</Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                variant={c.healthStatus === "Healthy" ? "default" : "destructive"}
                                className="whitespace-nowrap"
                              >
                                {c.healthStatus}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/cattle/${c.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    console.log("View cattle button clicked:", c.id)
                                  }}
                                  className="touch-manipulation min-h-[40px] px-3"
                                >
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {pen && (
        <>
          <PenFeedDialog
            open={isFeedDialogOpen}
            onOpenChange={setIsFeedDialogOpen}
            pen={pen}
            onSuccess={() => {
              // Refresh data if needed
            }}
          />

          <PenMedicationDialog
            open={isMedicationDialogOpen}
            onOpenChange={setIsMedicationDialogOpen}
            pen={pen}
            onSuccess={() => {
              // Refresh data if needed
            }}
          />
        </>
      )}

      {/* Update Pen Value Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pen Total Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pen-value">Total Value ($)</Label>
              <Input
                id="pen-value"
                type="number"
                placeholder="Enter total pen value"
                value={penValue}
                onChange={(e) => setPenValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty and save to reset to automatic calculation (sum of all cattle values)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsValueDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePenValue}>
                Update Value
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
