"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Grid3x3, Wheat, Syringe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePenStore } from "@/hooks/use-pen-store"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { PenFeedDialog } from "@/components/pen-feed-dialog"
import { PenMedicationDialog } from "@/components/pen-medication-dialog"
import { PenROICard } from "@/components/pen-roi-card"

export default function PenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getPen, barns } = usePenStore()
  const [pen, setPen] = useState<any>(null)
  const [barn, setBarn] = useState<any>(null)
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(true)
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)

  useEffect(() => {
    const loadPenData = async () => {
      const penData = getPen(params.id as string)
      if (penData) {
        setPen(penData)
        const barnData = barns.find(b => b.id === penData.barnId)
        setBarn(barnData)

        // Load cattle in this pen
        const allCattle = await firebaseDataStore.getCattle()
        const penCattle = allCattle.filter(c => c.penId === params.id)
        setCattle(penCattle)
      }
      setLoading(false)
    }

    loadPenData()
  }, [params.id, getPen, barns])

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
                <Button variant="outline" onClick={() => setIsFeedDialogOpen(true)}>
                  <Wheat className="h-4 w-4 mr-2" />
                  Record Feed
                </Button>
                <Button variant="outline" onClick={() => setIsMedicationDialogOpen(true)}>
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

            <PenROICard pen={pen} estimatedRevenue={0} />
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/cattle/${c.id}`)}
                            >
                              View
                            </Button>
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
  )
}
