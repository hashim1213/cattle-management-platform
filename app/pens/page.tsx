"use client"

import { useState } from "react"
import { Plus, Building2, Grid3x3, BarChart3, Edit, Trash2, Move, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { ManageBarnDialog } from "@/components/manage-barn-dialog"
import { ManagePenDialog } from "@/components/manage-pen-dialog"
import { BulkAssignCattleDialog } from "@/components/bulk-assign-cattle-dialog"
import { PenDetailsDialog } from "@/components/pen-details-dialog"
import { BarnAnalyticsDialog } from "@/components/barn-analytics-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Barn, Pen } from "@/lib/pen-store"

export default function PensPage() {
  const { barns, pens, getPenAnalytics, addBarn, updateBarn, deleteBarn, addPen, updatePen, deletePen } = usePenStore()
  const { log } = useActivityStore()
  const { toast } = useToast()
  const [selectedBarn, setSelectedBarn] = useState<string | null>(barns[0]?.id || null)
  const [viewMode, setViewMode] = useState<"visual" | "list">("visual")

  // Dialog states
  const [barnDialogOpen, setBarnDialogOpen] = useState(false)
  const [penDialogOpen, setPenDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [penDetailsDialogOpen, setPenDetailsDialogOpen] = useState(false)
  const [barnAnalyticsDialogOpen, setBarnAnalyticsDialogOpen] = useState(false)
  const [editingBarn, setEditingBarn] = useState<Barn | null>(null)
  const [editingPen, setEditingPen] = useState<Pen | null>(null)
  const [assignToPenId, setAssignToPenId] = useState<string | undefined>(undefined)
  const [selectedPenForDetails, setSelectedPenForDetails] = useState<string | null>(null)
  const [selectedBarnForAnalytics, setSelectedBarnForAnalytics] = useState<string | null>(null)

  const currentBarns = selectedBarn ? barns.filter((b) => b.id === selectedBarn) : barns
  const currentPens = selectedBarn ? pens.filter((p) => p.barnId === selectedBarn) : pens

  const analytics = getPenAnalytics(selectedBarn || undefined)

  // Handler functions
  const handleAddBarn = () => {
    setEditingBarn(null)
    setBarnDialogOpen(true)
  }

  const handleEditBarn = (barn: Barn) => {
    setEditingBarn(barn)
    setBarnDialogOpen(true)
  }

  const handleDeleteBarn = (barnId: string) => {
    if (confirm("Are you sure you want to delete this barn? All pens in this barn will also be deleted.")) {
      const barn = barns.find((b) => b.id === barnId)
      deleteBarn(barnId)

      // Log the activity
      if (barn) {
        log({
          type: "barn-deleted",
          entityType: "barn",
          entityId: barnId,
          entityName: barn.name,
          title: `Deleted barn: ${barn.name}`,
          description: `Removed barn and all associated pens`,
          performedBy: "Owner",
        })
      }

      toast({
        title: "Barn deleted",
        description: "The barn and its pens have been removed.",
      })
    }
  }

  const handleSaveBarn = (barnData: Omit<Barn, "id" | "createdAt" | "updatedAt">) => {
    if (editingBarn) {
      updateBarn(editingBarn.id, barnData)

      // Log the activity
      log({
        type: "barn-updated",
        entityType: "barn",
        entityId: editingBarn.id,
        entityName: barnData.name,
        title: `Updated barn: ${barnData.name}`,
        description: `Modified barn information`,
        performedBy: "Owner",
      })

      toast({
        title: "Barn updated",
        description: "The barn information has been updated.",
      })
    } else {
      const newBarnId = addBarn(barnData)

      // Log the activity
      log({
        type: "barn-created",
        entityType: "barn",
        entityId: newBarnId,
        entityName: barnData.name,
        title: `Created barn: ${barnData.name}`,
        description: `Added new barn at ${barnData.location}`,
        performedBy: "Owner",
      })

      toast({
        title: "Barn added",
        description: "A new barn has been created.",
      })
    }
  }

  const handleAddPen = () => {
    setEditingPen(null)
    setPenDialogOpen(true)
  }

  const handleEditPen = (pen: Pen) => {
    setEditingPen(pen)
    setPenDialogOpen(true)
  }

  const handleDeletePen = (penId: string) => {
    if (confirm("Are you sure you want to delete this pen? Cattle in this pen will become unassigned.")) {
      const pen = pens.find((p) => p.id === penId)
      const barn = pen ? barns.find((b) => b.id === pen.barnId) : null
      deletePen(penId)

      // Log the activity
      if (pen) {
        log({
          type: "pen-deleted",
          entityType: "pen",
          entityId: penId,
          entityName: pen.name,
          title: `Deleted pen: ${pen.name}`,
          description: `Removed pen from ${barn?.name || "barn"}`,
          performedBy: "Owner",
        })
      }

      toast({
        title: "Pen deleted",
        description: "The pen has been removed.",
      })
    }
  }

  const handleSavePen = (penData: Omit<Pen, "id" | "createdAt" | "updatedAt" | "currentCount">) => {
    const barn = barns.find((b) => b.id === penData.barnId)

    if (editingPen) {
      updatePen(editingPen.id, penData)

      // Log the activity
      log({
        type: "pen-updated",
        entityType: "pen",
        entityId: editingPen.id,
        entityName: penData.name,
        title: `Updated pen: ${penData.name}`,
        description: `Modified pen information in ${barn?.name || "barn"}`,
        performedBy: "Owner",
      })

      toast({
        title: "Pen updated",
        description: "The pen information has been updated.",
      })
    } else {
      const newPenId = addPen(penData)

      // Log the activity
      log({
        type: "pen-created",
        entityType: "pen",
        entityId: newPenId,
        entityName: penData.name,
        title: `Created pen: ${penData.name}`,
        description: `Added new pen to ${barn?.name || "barn"} with capacity ${penData.capacity}`,
        performedBy: "Owner",
      })

      toast({
        title: "Pen added",
        description: "A new pen has been created.",
      })
    }
  }

  const handleBulkAssign = (penId?: string) => {
    setAssignToPenId(penId)
    setBulkAssignDialogOpen(true)
  }

  const handleViewPenDetails = (penId: string) => {
    setSelectedPenForDetails(penId)
    setPenDetailsDialogOpen(true)
  }

  const handleViewBarnAnalytics = (barnId: string) => {
    setSelectedBarnForAnalytics(barnId)
    setBarnAnalyticsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pen Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visual barn and pen layout system
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAddBarn}>
                <Building2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Barn</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddPen}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Pen</span>
              </Button>
              <Button size="sm" onClick={() => handleBulkAssign()}>
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Assign Cattle</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Analytics Overview */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Pens</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{analytics.totalPens}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{analytics.totalCapacity}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{analytics.totalOccupied}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {analytics.utilizationRate.toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barn Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Select Barn</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "visual" ? "default" : "outline"}
                  onClick={() => setViewMode("visual")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => setViewMode("list")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedBarn === null ? "default" : "outline"}
                onClick={() => setSelectedBarn(null)}
              >
                All Barns
              </Button>
              {barns.map((barn) => (
                <Button
                  key={barn.id}
                  size="sm"
                  variant={selectedBarn === barn.id ? "default" : "outline"}
                  onClick={() => setSelectedBarn(barn.id)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {barn.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visual/List View */}
        {viewMode === "visual" ? (
          <div className="space-y-6">
            {currentBarns.map((barn) => {
              const barnPens = pens.filter((p) => p.barnId === barn.id)
              return (
                <Card key={barn.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {barn.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{barn.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {barnPens.length} pens • {barn.totalCapacity} capacity
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleViewBarnAnalytics(barn.id)}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditBarn(barn)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteBarn(barn.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Visual Pen Layout */}
                    <div
                      className="relative rounded-lg p-6 min-h-[500px] overflow-x-auto"
                      style={{
                        background: "linear-gradient(135deg, #b8925a 0%, #9d7d4a 50%, #8b6f3f 100%)",
                      }}
                    >
                      <svg
                        width="100%"
                        height="500"
                        viewBox="0 0 500 400"
                        className="min-w-[500px]"
                      >
                        {/* Background grass texture */}
                        <defs>
                          <pattern id="grass" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="#7aa44e" />
                            <circle cx="5" cy="5" r="1" fill="#6b9440" opacity="0.5" />
                            <circle cx="15" cy="15" r="1" fill="#6b9440" opacity="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grass)" opacity="0.3" />

                        {barnPens.map((pen) => {
                          const utilizationPercent = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
                          const strokeColor =
                            utilizationPercent > 90
                              ? "#dc2626"
                              : utilizationPercent > 70
                                ? "#ea580c"
                                : "#059669"

                          return (
                            <g key={pen.id} onClick={() => handleViewPenDetails(pen.id)} className="cursor-pointer">
                              {/* Fence Border - Top */}
                              <rect
                                x={pen.location?.x || 0}
                                y={pen.location?.y || 0}
                                width={pen.location?.width || 100}
                                height="3"
                                fill="#654321"
                              />
                              {/* Fence Border - Bottom */}
                              <rect
                                x={pen.location?.x || 0}
                                y={(pen.location?.y || 0) + (pen.location?.height || 80) - 3}
                                width={pen.location?.width || 100}
                                height="3"
                                fill="#654321"
                              />
                              {/* Fence Border - Left */}
                              <rect
                                x={pen.location?.x || 0}
                                y={pen.location?.y || 0}
                                width="3"
                                height={pen.location?.height || 80}
                                fill="#654321"
                              />
                              {/* Fence Border - Right */}
                              <rect
                                x={(pen.location?.x || 0) + (pen.location?.width || 100) - 3}
                                y={pen.location?.y || 0}
                                width="3"
                                height={pen.location?.height || 80}
                                fill="#654321"
                              />

                              {/* Fence Posts */}
                              {Array.from({ length: 5 }).map((_, i) => (
                                <rect
                                  key={`post-${i}`}
                                  x={(pen.location?.x || 0) + ((pen.location?.width || 100) / 4) * i - 2}
                                  y={pen.location?.y || 0}
                                  width="4"
                                  height={pen.location?.height || 80}
                                  fill="#4a2511"
                                  opacity="0.6"
                                />
                              ))}

                              {/* Pen Background */}
                              <rect
                                x={(pen.location?.x || 0) + 3}
                                y={(pen.location?.y || 0) + 3}
                                width={(pen.location?.width || 100) - 6}
                                height={(pen.location?.height || 80) - 6}
                                fill="#9cb378"
                                fillOpacity="0.4"
                                className="cursor-pointer hover:fill-opacity-60 transition-all"
                              />

                              {/* Status Indicator Bar */}
                              <rect
                                x={(pen.location?.x || 0) + 5}
                                y={(pen.location?.y || 0) + 5}
                                width={(pen.location?.width || 100) - 10}
                                height="4"
                                fill={strokeColor}
                                opacity="0.8"
                              />

                              {/* Pen Name Badge */}
                              <rect
                                x={(pen.location?.x || 0) + (pen.location?.width || 100) / 2 - 35}
                                y={(pen.location?.y || 0) + 15}
                                width="70"
                                height="20"
                                fill="white"
                                stroke={strokeColor}
                                strokeWidth="2"
                                rx="3"
                                opacity="0.95"
                              />
                              <text
                                x={(pen.location?.x || 0) + (pen.location?.width || 100) / 2}
                                y={(pen.location?.y || 0) + 29}
                                textAnchor="middle"
                                className="font-bold"
                                fontSize="12"
                                fill="#1f2937"
                              >
                                {pen.name}
                              </text>

                              {/* Cattle Count */}
                              <text
                                x={(pen.location?.x || 0) + (pen.location?.width || 100) / 2}
                                y={(pen.location?.y || 0) + 48}
                                textAnchor="middle"
                                className="font-semibold"
                                fontSize="11"
                                fill="#374151"
                              >
                                {pen.currentCount}/{pen.capacity} head
                              </text>

                              {/* Cow Icons */}
                              {Array.from({ length: Math.min(pen.currentCount, 8) }).map((_, idx) => {
                                const cols = 4
                                const row = Math.floor(idx / cols)
                                const col = idx % cols
                                const spacing = (pen.location?.width || 100) / (cols + 1)
                                const startY = (pen.location?.y || 0) + 60

                                return (
                                  <text
                                    key={idx}
                                    x={(pen.location?.x || 0) + spacing * (col + 1)}
                                    y={startY + row * 18}
                                    textAnchor="middle"
                                    fontSize="16"
                                  >
                                    🐄
                                  </text>
                                )
                              })}
                              {pen.currentCount > 8 && (
                                <text
                                  x={(pen.location?.x || 0) + (pen.location?.width || 100) / 2}
                                  y={(pen.location?.y || 0) + (pen.location?.height || 80) - 12}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#1f2937"
                                  className="font-semibold"
                                >
                                  +{pen.currentCount - 8} more
                                </text>
                              )}
                            </g>
                          )
                        })}
                      </svg>
                    </div>

                    {/* Pen Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {barnPens.map((pen) => {
                        const utilizationPercent = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
                        return (
                          <Card key={pen.id} className="border-l-4" style={{ borderLeftColor: utilizationPercent > 90 ? "#ef4444" : utilizationPercent > 70 ? "#f59e0b" : "#10b981" }}>
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm">{pen.name}</span>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleEditPen(pen)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleBulkAssign(pen.id)}>
                                      <Users className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Capacity</span>
                                    <span className="font-medium">
                                      {pen.currentCount}/{pen.capacity}
                                    </span>
                                  </div>
                                  <Progress value={utilizationPercent} className="h-1.5" />
                                  <p className="text-xs text-muted-foreground">
                                    {pen.capacity - pen.currentCount} available
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle>All Pens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPens.map((pen) => {
                  const barn = barns.find((b) => b.id === pen.barnId)
                  const utilizationPercent = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0

                  return (
                    <div
                      key={pen.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{pen.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {barn?.name}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Capacity: {pen.currentCount}/{pen.capacity}
                            </span>
                            <span className="text-muted-foreground">
                              Available: {pen.capacity - pen.currentCount}
                            </span>
                          </div>
                          <Progress value={utilizationPercent} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleBulkAssign(pen.id)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditPen(pen)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeletePen(pen.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialogs */}
      <ManageBarnDialog
        barn={editingBarn}
        open={barnDialogOpen}
        onOpenChange={setBarnDialogOpen}
        onSave={handleSaveBarn}
      />

      <ManagePenDialog
        pen={editingPen}
        barns={barns}
        open={penDialogOpen}
        onOpenChange={setPenDialogOpen}
        onSave={handleSavePen}
      />

      <BulkAssignCattleDialog
        penId={assignToPenId}
        open={bulkAssignDialogOpen}
        onOpenChange={setBulkAssignDialogOpen}
        onSave={() => {
          toast({
            title: "Cattle assigned",
            description: "The cattle have been successfully assigned to the pen.",
          })
        }}
      />

      <PenDetailsDialog
        penId={selectedPenForDetails}
        open={penDetailsDialogOpen}
        onOpenChange={setPenDetailsDialogOpen}
        onAssignCattle={() => {
          if (selectedPenForDetails) {
            setPenDetailsDialogOpen(false)
            handleBulkAssign(selectedPenForDetails)
          }
        }}
      />

      <BarnAnalyticsDialog
        barnId={selectedBarnForAnalytics}
        open={barnAnalyticsDialogOpen}
        onOpenChange={setBarnAnalyticsDialogOpen}
      />
    </div>
  )
}
