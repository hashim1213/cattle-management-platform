"use client"

import { useState, useRef } from "react"
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

type DragState = {
  penId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  currentX: number
  currentY: number
}

type ResizeState = {
  penId: string
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startPenX: number
  startPenY: number
  currentWidth: number
  currentHeight: number
  currentX: number
  currentY: number
  handle: "se" | "sw" | "ne" | "nw" // southeast, southwest, northeast, northwest
}

export default function PensPage() {
  const { barns, pens, getPenAnalytics, addBarn, updateBarn, deleteBarn, addPen, updatePen, deletePen, resetToDefault } = usePenStore()
  const { log } = useActivityStore()
  const { toast } = useToast()
  const [selectedBarn, setSelectedBarn] = useState<string | null>(barns[0]?.id || null)
  const [viewMode, setViewMode] = useState<"visual" | "list">("visual")
  const [editMode, setEditMode] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

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

  // Drag and drop handlers
  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const CTM = svgRef.current.getScreenCTM()
    if (!CTM) return { x: 0, y: 0 }
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d,
    }
  }

  const handlePenMouseDown = (e: React.MouseEvent<SVGGElement>, penId: string) => {
    if (!editMode) return // Only allow dragging in edit mode
    e.stopPropagation()
    const pen = pens.find((p) => p.id === penId)
    if (!pen?.location) return

    const mousePos = getMousePosition(e as any)
    setDragState({
      penId,
      startX: mousePos.x,
      startY: mousePos.y,
      offsetX: mousePos.x - pen.location.x,
      offsetY: mousePos.y - pen.location.y,
      currentX: pen.location.x,
      currentY: pen.location.y,
    })
  }

  const handleResizeMouseDown = (
    e: React.MouseEvent<SVGRectElement>,
    penId: string,
    handle: "se" | "sw" | "ne" | "nw",
  ) => {
    if (!editMode) return // Only allow resizing in edit mode
    e.stopPropagation()
    const pen = pens.find((p) => p.id === penId)
    if (!pen?.location) return

    const mousePos = getMousePosition(e as any)
    setResizeState({
      penId,
      startX: mousePos.x,
      startY: mousePos.y,
      startWidth: pen.location.width,
      startHeight: pen.location.height,
      startPenX: pen.location.x,
      startPenY: pen.location.y,
      currentWidth: pen.location.width,
      currentHeight: pen.location.height,
      currentX: pen.location.x,
      currentY: pen.location.y,
      handle,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const mousePos = getMousePosition(e)

    if (dragState) {
      const pen = pens.find((p) => p.id === dragState.penId)
      if (!pen?.location) return

      const newX = mousePos.x - dragState.offsetX
      const newY = mousePos.y - dragState.offsetY

      // Strict SVG bounds - keep entire pen within viewBox
      const constrainedX = Math.max(0, Math.min(500 - pen.location.width, newX))
      const constrainedY = Math.max(0, Math.min(400 - pen.location.height, newY))

      // Update local drag state only
      setDragState({
        ...dragState,
        currentX: constrainedX,
        currentY: constrainedY,
      })
    }

    if (resizeState) {
      const deltaX = mousePos.x - resizeState.startX
      const deltaY = mousePos.y - resizeState.startY

      let newWidth = resizeState.startWidth
      let newHeight = resizeState.startHeight
      let newX = resizeState.startPenX
      let newY = resizeState.startPenY

      // Calculate new dimensions based on handle
      if (resizeState.handle === "se") {
        newWidth = Math.max(150, resizeState.startWidth + deltaX)
        newHeight = Math.max(100, resizeState.startHeight + deltaY)
      } else if (resizeState.handle === "sw") {
        newWidth = Math.max(150, resizeState.startWidth - deltaX)
        newHeight = Math.max(100, resizeState.startHeight + deltaY)
        newX = resizeState.startPenX + (resizeState.startWidth - newWidth)
      } else if (resizeState.handle === "ne") {
        newWidth = Math.max(150, resizeState.startWidth + deltaX)
        newHeight = Math.max(100, resizeState.startHeight - deltaY)
        newY = resizeState.startPenY + (resizeState.startHeight - newHeight)
      } else if (resizeState.handle === "nw") {
        newWidth = Math.max(150, resizeState.startWidth - deltaX)
        newHeight = Math.max(100, resizeState.startHeight - deltaY)
        newX = resizeState.startPenX + (resizeState.startWidth - newWidth)
        newY = resizeState.startPenY + (resizeState.startHeight - newHeight)
      }

      // Strict bounds - ensure pen stays within SVG viewBox
      if (newX < 0) {
        newWidth += newX
        newX = 0
      }
      if (newY < 0) {
        newHeight += newY
        newY = 0
      }
      if (newX + newWidth > 500) {
        newWidth = 500 - newX
      }
      if (newY + newHeight > 400) {
        newHeight = 400 - newY
      }

      // Enforce minimum sizes
      newWidth = Math.max(150, newWidth)
      newHeight = Math.max(100, newHeight)

      // Update local resize state only
      setResizeState({
        ...resizeState,
        currentWidth: newWidth,
        currentHeight: newHeight,
        currentX: newX,
        currentY: newY,
      })
    }
  }

  const handleMouseUp = () => {
    if (dragState) {
      const pen = pens.find((p) => p.id === dragState.penId)
      if (pen?.location) {
        // Save final position to store
        updatePen(dragState.penId, {
          location: {
            ...pen.location,
            x: dragState.currentX,
            y: dragState.currentY,
          },
        })

        log({
          type: "pen-updated",
          entityType: "pen",
          entityId: pen.id,
          entityName: pen.name,
          title: `Moved pen: ${pen.name}`,
          description: `Repositioned pen in barn layout`,
          performedBy: "Owner",
        })
      }
      setDragState(null)
    }

    if (resizeState) {
      const pen = pens.find((p) => p.id === resizeState.penId)
      if (pen?.location) {
        // Save final size and position to store
        updatePen(resizeState.penId, {
          location: {
            x: resizeState.currentX,
            y: resizeState.currentY,
            width: resizeState.currentWidth,
            height: resizeState.currentHeight,
          },
        })

        log({
          type: "pen-updated",
          entityType: "pen",
          entityId: pen.id,
          entityName: pen.name,
          title: `Resized pen: ${pen.name}`,
          description: `Adjusted pen dimensions`,
          performedBy: "Owner",
        })
      }
      setResizeState(null)
    }
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
                  variant={editMode ? "default" : "outline"}
                  onClick={() => {
                    setEditMode(!editMode)
                    toast({
                      title: editMode ? "View Mode" : "Edit Mode",
                      description: editMode
                        ? "Pen editing disabled"
                        : "You can now drag and resize pens",
                    })
                  }}
                  className={editMode ? "bg-primary" : ""}
                >
                  <Move className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{editMode ? "Exit Edit" : "Edit Layout"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset all pen positions and sizes to default? This cannot be undone.")) {
                      resetToDefault()
                      toast({
                        title: "Layout Reset",
                        description: "All pens have been reset to default positions and sizes",
                      })
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Reset Layout</span>
                </Button>
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
                      className="relative rounded-xl p-6 min-h-[500px] overflow-x-auto"
                      style={{
                        background: "linear-gradient(135deg, #1e3a2f 0%, #2d4a3e 50%, #3d5a4e 100%)",
                      }}
                    >
                      {editMode && (
                        <div className="absolute top-4 left-4 z-10 bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-white/20 animate-pulse">
                          <div className="flex items-center gap-2">
                            <Move className="h-4 w-4" />
                            <span className="text-sm font-semibold">Edit Mode Active</span>
                          </div>
                        </div>
                      )}
                      <svg
                        ref={svgRef}
                        width="100%"
                        height="500"
                        viewBox="0 0 500 400"
                        className="min-w-[500px]"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        {/* Modern gradient definitions */}
                        <defs>
                          {/* Grass pattern */}
                          <pattern id="grass" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#4a7c59" />
                            <circle cx="10" cy="10" r="2" fill="#5a8c69" opacity="0.6" />
                            <circle cx="30" cy="20" r="2" fill="#3a6c49" opacity="0.6" />
                            <circle cx="20" cy="30" r="2" fill="#5a8c69" opacity="0.6" />
                          </pattern>

                          {/* Pen gradient backgrounds */}
                          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#f5f5dc", stopOpacity: 0.95 }} />
                            <stop offset="100%" style={{ stopColor: "#e8dcc0", stopOpacity: 0.95 }} />
                          </linearGradient>

                          {/* Shadow filter for depth */}
                          <filter id="penShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                            <feOffset dx="2" dy="3" result="offsetblur"/>
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.4"/>
                            </feComponentTransfer>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>

                          {/* Glow effect for active pens */}
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Background */}
                        <rect width="100%" height="100%" fill="url(#grass)" opacity="0.4" />

                        {barnPens.map((pen) => {
                          const utilizationPercent = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
                          const strokeColor =
                            utilizationPercent > 90
                              ? "#dc2626"
                              : utilizationPercent > 70
                                ? "#ea580c"
                                : "#059669"

                          // Auto-calculate pen size based on cattle count for better representation
                          const cattleCount = pen.currentCount
                          const minWidth = 150
                          const minHeight = 100
                          // Calculate grid needed for cattle icons (4 per row)
                          const cowsPerRow = 4
                          const rows = Math.ceil(cattleCount / cowsPerRow)
                          const cols = Math.min(cattleCount, cowsPerRow)
                          // Calculate size needed (each cow needs ~35x25 space)
                          const neededWidth = Math.max(minWidth, cols * 35 + 50)
                          const neededHeight = Math.max(minHeight, rows * 25 + 80)

                          const penWidth = pen.location?.width || neededWidth
                          const penHeight = pen.location?.height || neededHeight

                          // Use drag/resize state for real-time preview
                          let penX = pen.location?.x || 0
                          let penY = pen.location?.y || 0
                          let displayWidth = penWidth
                          let displayHeight = penHeight

                          if (dragState?.penId === pen.id) {
                            penX = dragState.currentX
                            penY = dragState.currentY
                          }

                          if (resizeState?.penId === pen.id) {
                            penX = resizeState.currentX
                            penY = resizeState.currentY
                            displayWidth = resizeState.currentWidth
                            displayHeight = resizeState.currentHeight
                          }

                          return (
                            <g
                              key={pen.id}
                              onMouseDown={(e) => handlePenMouseDown(e, pen.id)}
                              className="pen-group"
                              style={{ transition: editMode ? 'none' : 'all 0.3s ease' }}
                            >
                              {/* Drop shadow for depth */}
                              <rect
                                x={penX + 2}
                                y={penY + 3}
                                width={displayWidth}
                                height={displayHeight}
                                fill="black"
                                opacity="0.15"
                                rx="8"
                                className="pointer-events-none"
                              />

                              {/* Main pen background with gradient */}
                              <rect
                                x={penX}
                                y={penY}
                                width={displayWidth}
                                height={displayHeight}
                                fill="url(#penGradient)"
                                stroke={strokeColor}
                                strokeWidth="3"
                                rx="8"
                                className={editMode ? "cursor-move" : "cursor-pointer"}
                                style={{
                                  filter: editMode && (dragState?.penId === pen.id || resizeState?.penId === pen.id)
                                    ? 'url(#glow)'
                                    : 'url(#penShadow)',
                                  transition: 'all 0.2s ease'
                                }}
                                onDoubleClick={() => !editMode && handleViewPenDetails(pen.id)}
                              />

                              {/* Wooden fence rails */}
                              <line
                                x1={penX}
                                y1={penY + 15}
                                x2={penX + displayWidth}
                                y2={penY + 15}
                                stroke="#8B4513"
                                strokeWidth="2"
                                opacity="0.4"
                                className="pointer-events-none"
                              />
                              <line
                                x1={penX}
                                y1={penY + displayHeight - 15}
                                x2={penX + displayWidth}
                                y2={penY + displayHeight - 15}
                                stroke="#8B4513"
                                strokeWidth="2"
                                opacity="0.4"
                                className="pointer-events-none"
                              />

                              {/* Status indicator - top bar */}
                              <rect
                                x={penX}
                                y={penY}
                                width={displayWidth * (utilizationPercent / 100)}
                                height="6"
                                fill={strokeColor}
                                opacity="0.8"
                                rx="8"
                                className="pointer-events-none"
                                style={{ transition: 'width 0.3s ease' }}
                              />

                              {/* Pen name badge with glassmorphism effect */}
                              <g className="pointer-events-none">
                                <rect
                                  x={penX + displayWidth / 2 - 45}
                                  y={penY + 25}
                                  width="90"
                                  height="28"
                                  fill="white"
                                  fillOpacity="0.95"
                                  stroke={strokeColor}
                                  strokeWidth="2"
                                  rx="6"
                                />
                                <text
                                  x={penX + displayWidth / 2}
                                  y={penY + 42}
                                  textAnchor="middle"
                                  className="font-bold"
                                  fontSize="13"
                                  fill="#1f2937"
                                >
                                  {pen.name}
                                </text>
                              </g>

                              {/* Cattle count badge */}
                              <g className="pointer-events-none">
                                <rect
                                  x={penX + 8}
                                  y={penY + displayHeight - 28}
                                  width="80"
                                  height="22"
                                  fill={strokeColor}
                                  fillOpacity="0.9"
                                  rx="4"
                                />
                                <text
                                  x={penX + 48}
                                  y={penY + displayHeight - 13}
                                  textAnchor="middle"
                                  className="font-semibold"
                                  fontSize="11"
                                  fill="white"
                                >
                                  {pen.currentCount}/{pen.capacity} head
                                </text>
                              </g>

                              {/* Cow Icons with improved layout */}
                              {Array.from({ length: Math.min(pen.currentCount, 16) }).map((_, idx) => {
                                const cols = 4
                                const row = Math.floor(idx / cols)
                                const col = idx % cols
                                const spacing = displayWidth / (cols + 1)
                                const startY = penY + 65

                                return (
                                  <g key={idx} className="cow-icon pointer-events-none">
                                    {/* Cow shadow */}
                                    <ellipse
                                      cx={penX + spacing * (col + 1)}
                                      cy={startY + row * 22 + 8}
                                      rx="8"
                                      ry="2"
                                      fill="black"
                                      opacity="0.2"
                                    />
                                    <text
                                      x={penX + spacing * (col + 1)}
                                      y={startY + row * 22}
                                      textAnchor="middle"
                                      fontSize="18"
                                      style={{
                                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                                      }}
                                    >
                                      🐄
                                    </text>
                                  </g>
                                )
                              })}
                              {pen.currentCount > 16 && (
                                <g className="pointer-events-none">
                                  <rect
                                    x={penX + displayWidth / 2 - 25}
                                    y={penY + displayHeight - 55}
                                    width="50"
                                    height="20"
                                    fill="rgba(255,255,255,0.8)"
                                    rx="10"
                                  />
                                  <text
                                    x={penX + displayWidth / 2}
                                    y={penY + displayHeight - 41}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#1f2937"
                                    className="font-bold"
                                  >
                                    +{pen.currentCount - 16}
                                  </text>
                                </g>
                              )}

                              {/* Resize Handles - only in edit mode */}
                              {editMode && (
                                <g>
                                  {/* Southeast handle */}
                                  <rect
                                    x={penX + displayWidth - 10}
                                    y={penY + displayHeight - 10}
                                    width="10"
                                    height="10"
                                    fill="white"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                    rx="2"
                                    className="cursor-se-resize hover:scale-110 transition-transform"
                                    onMouseDown={(e) => handleResizeMouseDown(e, pen.id, "se")}
                                  />
                                  {/* Southwest handle */}
                                  <rect
                                    x={penX}
                                    y={penY + displayHeight - 10}
                                    width="10"
                                    height="10"
                                    fill="white"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                    rx="2"
                                    className="cursor-sw-resize hover:scale-110 transition-transform"
                                    onMouseDown={(e) => handleResizeMouseDown(e, pen.id, "sw")}
                                  />
                                  {/* Northeast handle */}
                                  <rect
                                    x={penX + displayWidth - 10}
                                    y={penY}
                                    width="10"
                                    height="10"
                                    fill="white"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                    rx="2"
                                    className="cursor-ne-resize hover:scale-110 transition-transform"
                                    onMouseDown={(e) => handleResizeMouseDown(e, pen.id, "ne")}
                                  />
                                  {/* Northwest handle */}
                                  <rect
                                    x={penX}
                                    y={penY}
                                    width="10"
                                    height="10"
                                    fill="white"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                    rx="2"
                                    className="cursor-nw-resize hover:scale-110 transition-transform"
                                    onMouseDown={(e) => handleResizeMouseDown(e, pen.id, "nw")}
                                  />
                                </g>
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
