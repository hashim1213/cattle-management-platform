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
  const { getPen, barns, updatePen, pens } = usePenStore()
  const [pen, setPen] = useState<any>(null)
  const [barn, setBarn] = useState<any>(null)
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(true)
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [penValue, setPenValue] = useState<string>("")

  useEffect(() => {
    const loadPenData = async () => {
      try {
        console.log("Loading pen detail page data...")
        const penData = getPen(params.id as string)
        console.log("Pen data:", penData)

        if (penData) {
          setPen(penData)
          const barnData = barns.find(b => b.id === penData.barnId)
          setBarn(barnData)

          // Load cattle in this pen
          const allCattle = await firebaseDataStore.getCattle()
          console.log(`Total cattle loaded: ${allCattle.length}`)
          const penCattle = allCattle.filter(c => c.penId === params.id)
          console.log(`Cattle in this pen: ${penCattle.length}`)
          setCattle(penCattle)
        } else {
          console.error("Pen not found:", params.id)
        }
      } catch (error) {
        console.error("Error loading pen data:", error)
        // Set empty state on error
        setCattle([])
      } finally {
        setLoading(false)
      }
    }

    loadPenData()
    // Only reload when pen ID changes or when pens/barns length changes (not reference)
  }, [params.id, pens.length, barns.length, getPen])

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

  if (loading || !pen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const utilizationRate = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
  const available = pen.capacity - pen.currentCount

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Link
              href="/pens"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pens
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Grid3x3 className="h-8 w-8 text-muted-foreground" />
                  <h1 className="text-3xl font-bold">{pen.name}</h1>
                  <Badge variant={utilizationRate > 80 ? "destructive" : utilizationRate > 50 ? "default" : "secondary"}>
                    {utilizationRate.toFixed(0)}% Full
                  </Badge>
                </div>
                {barn && (
                  <p className="text-muted-foreground mt-1">
                    {barn.name} • {barn.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Record Feed button clicked")
                    setIsFeedDialogOpen(true)
                  }}
                >
                  <Wheat className="h-4 w-4 mr-2" />
                  Record Feed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Record Meds button clicked")
                    setIsMedicationDialogOpen(true)
                  }}
                >
                  <Syringe className="h-4 w-4 mr-2" />
                  Record Meds
                </Button>
              </div>
            </div>
          </div>

          {/* Pen Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="flex flex-col gap-2 items-end">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log("Update Value button clicked")
                        setPenValue(displayTotalValue.toString())
                        setIsValueDialogOpen(true)
                      }}
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Tag Number</th>
                        <th className="text-left p-3 text-sm font-semibold">Breed</th>
                        <th className="text-left p-3 text-sm font-semibold">Sex</th>
                        <th className="text-left p-3 text-sm font-semibold">Weight</th>
                        <th className="text-left p-3 text-sm font-semibold">Stage</th>
                        <th className="text-left p-3 text-sm font-semibold">Health</th>
                        <th className="text-left p-3 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cattle.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="p-3">
                            <Link
                              href={`/cattle/${c.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              #{c.tagNumber}
                            </Link>
                          </td>
                          <td className="p-3 text-sm">{c.breed}</td>
                          <td className="p-3 text-sm">{c.sex}</td>
                          <td className="p-3 text-sm">{c.weight} lbs</td>
                          <td className="p-3">
                            <Badge variant="outline">{c.stage}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={c.healthStatus === "Healthy" ? "default" : "destructive"}
                            >
                              {c.healthStatus}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Link href={`/cattle/${c.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  console.log("View cattle button clicked:", c.id)
                                }}
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
