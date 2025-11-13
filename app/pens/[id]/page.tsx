"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Grid3x3, Syringe, DollarSign, Weight, MoveRight, MoreVertical, Filter, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePenStore } from "@/hooks/use-pen-store"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { PenMedicationDialog } from "@/components/pen-medication-dialog"
import { BulkTreatmentDialog } from "@/components/bulk-treatment-dialog"
import { PenROICard } from "@/components/pen-roi-card"
import { ActivityLogItem } from "@/components/activity-log-item"
import { useActivityStore } from "@/hooks/use-activity-store"
import { QuickFeedPanel } from "@/components/quick-feed-panel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function PenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { barns, updatePen, pens, loading: pensLoading } = usePenStore()
  const { getEntityActivities } = useActivityStore()
  const [pen, setPen] = useState<any>(null)
  const [barn, setBarn] = useState<any>(null)
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [filteredCattle, setFilteredCattle] = useState<Cattle[]>([])
  const [cattleLoading, setCattleLoading] = useState(true)
  const [selectedCattleIds, setSelectedCattleIds] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const [isBulkTreatmentDialogOpen, setIsBulkTreatmentDialogOpen] = useState(false)
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false)
  const [isBulkWeighDialogOpen, setIsBulkWeighDialogOpen] = useState(false)

  // Bulk operation states
  const [targetPenId, setTargetPenId] = useState("")
  const [bulkWeight, setBulkWeight] = useState("")

  // Track if we're currently syncing pen count to prevent loops
  const isSyncingRef = useRef(false)

  // Update pen when pens array changes
  useEffect(() => {
    const foundPen = pens.find(p => p.id === params.id)
    if (foundPen) {
      setPen(foundPen)
      const foundBarn = barns.find(b => b.id === foundPen.barnId)
      setBarn(foundBarn)
    }
  }, [pens, barns, params.id])

  // Load cattle and subscribe to real-time updates
  useEffect(() => {
    const loadCattle = async () => {
      try {
        setCattleLoading(true)
        const allCattle = await firebaseDataStore.getCattle()
        const penCattle = allCattle.filter(c => c.penId === params.id && c.status === "Active")
        setCattle(penCattle)
      } catch (error) {
        console.error("Error loading cattle:", error)
        setCattle([])
      } finally {
        setCattleLoading(false)
      }
    }

    loadCattle()

    // Subscribe to cattle updates
    const unsubscribe = firebaseDataStore.subscribe(() => {
      loadCattle()
    })

    return () => unsubscribe()
  }, [params.id])

  // Sync pen count with actual cattle count when both are loaded
  useEffect(() => {
    const syncPenCount = async () => {
      // Prevent concurrent syncs and infinite loops
      if (isSyncingRef.current) return
      if (!pen || cattleLoading || cattle.length === pen.currentCount) return

      console.log(`Syncing pen count: ${pen.currentCount} -> ${cattle.length}`)
      isSyncingRef.current = true

      try {
        await updatePen(pen.id, { currentCount: cattle.length })
      } catch (error) {
        console.error("Failed to sync pen count:", error)
      } finally {
        isSyncingRef.current = false
      }
    }

    syncPenCount()
  }, [pen?.id, cattle.length, cattleLoading, updatePen])

  // Filter and search cattle
  useEffect(() => {
    let filtered = [...cattle]

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.healthStatus === filterStatus)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.tagNumber?.toLowerCase().includes(query) ||
        c.breed?.toLowerCase().includes(query) ||
        c.id?.toLowerCase().includes(query)
      )
    }

    setFilteredCattle(filtered)
  }, [cattle, filterStatus, searchQuery])

  const loading = pensLoading || (cattleLoading && !pen)

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedCattleIds.size === filteredCattle.length) {
      setSelectedCattleIds(new Set())
    } else {
      setSelectedCattleIds(new Set(filteredCattle.map(c => c.id)))
    }
  }

  const toggleSelectCattle = (id: string) => {
    const newSelected = new Set(selectedCattleIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCattleIds(newSelected)
  }

  const getSelectedCattle = () => {
    return cattle.filter(c => selectedCattleIds.has(c.id))
  }

  // Bulk operations
  const handleBulkMoveToPen = async () => {
    if (!targetPenId) {
      toast.error("Please select a target pen")
      return
    }

    try {
      const selectedCattle = getSelectedCattle()
      const currentPenId = pen?.id

      // Update each cattle with new pen assignment
      for (const c of selectedCattle) {
        await firebaseDataStore.updateCattle(c.id, { penId: targetPenId })
      }

      // Update pen counts
      if (currentPenId) {
        await updatePen(currentPenId, {
          currentCount: Math.max(0, (pen?.currentCount || 0) - selectedCattle.length)
        })
      }

      const targetPen = pens.find(p => p.id === targetPenId)
      if (targetPen) {
        await updatePen(targetPenId, {
          currentCount: (targetPen.currentCount || 0) + selectedCattle.length
        })
      }

      toast.success(`Moved ${selectedCattle.length} cattle to new pen`)
      setIsBulkMoveDialogOpen(false)
      setSelectedCattleIds(new Set())
      setTargetPenId("")
    } catch (error) {
      toast.error("Failed to move cattle")
      console.error(error)
    }
  }

  const handleBulkWeigh = async () => {
    if (!bulkWeight) {
      toast.error("Please enter weight")
      return
    }

    try {
      const weight = parseFloat(bulkWeight)
      const selectedCattle = getSelectedCattle()

      for (const c of selectedCattle) {
        await firebaseDataStore.updateCattle(c.id, { weight })
        await firebaseDataStore.addWeightRecord(c.id, {
          date: new Date().toISOString().split('T')[0],
          weight,
          notes: "Bulk weight update"
        })
      }

      toast.success(`Updated weight for ${selectedCattle.length} cattle`)
      setIsBulkWeighDialogOpen(false)
      setSelectedCattleIds(new Set())
      setBulkWeight("")
    } catch (error) {
      toast.error("Failed to update weights")
      console.error(error)
    }
  }

  const handleRowClick = (cattleId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or action buttons
    const target = event.target as HTMLElement
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return
    }
    router.push(`/cattle/${cattleId}`)
  }

  // Show loading only on initial load
  if (loading && !pen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // If pens have loaded but pen not found, show error
  if (!pensLoading && !pen && pens.length > 0) {
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

  if (!pen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading pen data...</p>
      </div>
    )
  }

  const utilizationRate = pen.capacity > 0 ? (cattle.length / pen.capacity) * 100 : 0
  const available = pen.capacity - cattle.length
  const allSelected = filteredCattle.length > 0 && selectedCattleIds.size === filteredCattle.length
  const someSelected = selectedCattleIds.size > 0 && selectedCattleIds.size < filteredCattle.length
  const recentActivities = getEntityActivities("pen", pen.id, 20)

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
                  onClick={() => setIsMedicationDialogOpen(true)}
                  className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
                >
                  <Syringe className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="sm:inline">Meds</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cattle">Cattle ({cattle.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Capacity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Occupied</span>
                        <span className="font-medium">{cattle.length} / {pen.capacity}</span>
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
                    <CardTitle className="text-lg">Health Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Healthy</span>
                        <Badge variant="default">{cattle.filter(c => c.healthStatus === "Healthy").length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sick/Treatment</span>
                        <Badge variant="destructive">
                          {cattle.filter(c => c.healthStatus === "Sick" || c.healthStatus === "Treatment").length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quarantine</span>
                        <Badge variant="outline">{cattle.filter(c => c.healthStatus === "Quarantine").length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pen Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pen ID</span>
                        <span className="font-medium text-xs">{pen.id.substring(0, 12)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Capacity</span>
                        <span className="font-medium">{pen.capacity} head</span>
                      </div>
                      {pen.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-muted-foreground text-xs">Notes:</p>
                          <p className="text-foreground text-xs">{pen.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Card */}
              <PenROICard pen={pen} estimatedRevenue={0} />

              {/* Quick Feed Panel */}
              <QuickFeedPanel penId={pen.id} penName={pen.name} cattleCount={cattle.length} />
            </TabsContent>

            {/* Cattle Tab */}
            <TabsContent value="cattle" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Cattle in this Pen ({filteredCattle.length})</CardTitle>
                  {selectedCattleIds.size > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCattleIds.size} selected
                    </p>
                  )}
                </div>
                {selectedCattleIds.size > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBulkMoveDialogOpen(true)}
                      className="touch-manipulation"
                    >
                      <MoveRight className="h-4 w-4 mr-2" />
                      Move ({selectedCattleIds.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBulkTreatmentDialogOpen(true)}
                      className="touch-manipulation"
                    >
                      <Syringe className="h-4 w-4 mr-2" />
                      Treat ({selectedCattleIds.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBulkWeighDialogOpen(true)}
                      className="touch-manipulation"
                    >
                      <Weight className="h-4 w-4 mr-2" />
                      Weigh ({selectedCattleIds.size})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by tag number or breed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredCattle.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{cattle.length === 0 ? "No cattle in this pen yet" : "No cattle match your filters"}</p>
                  <p className="text-sm mt-1">
                    {cattle.length === 0 ? "Assign cattle to this pen to see them here" : "Try adjusting your search or filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left px-3 py-3 w-12">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={toggleSelectAll}
                              ref={(el) => {
                                if (el) {
                                  (el as any).indeterminate = someSelected
                                }
                              }}
                            />
                          </th>
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
                        {filteredCattle.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={(e) => handleRowClick(c.id, e)}
                          >
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedCattleIds.has(c.id)}
                                onCheckedChange={() => toggleSelectCattle(c.id)}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-medium text-primary">
                                #{c.tagNumber}
                              </span>
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
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => router.push(`/cattle/${c.id}`)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCattleIds(new Set([c.id]))
                                    setIsBulkWeighDialogOpen(true)
                                  }}>
                                    Record Weight
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCattleIds(new Set([c.id]))
                                    setIsBulkTreatmentDialogOpen(true)
                                  }}>
                                    Add Treatment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity recorded yet</p>
                      <p className="text-sm mt-1">Activity will appear here as you work with this pen</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <ActivityLogItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {pen && (
        <>
          <PenMedicationDialog
            open={isMedicationDialogOpen}
            onOpenChange={setIsMedicationDialogOpen}
            pen={pen}
            onSuccess={() => {}}
          />

          {selectedCattleIds.size > 0 && (
            <BulkTreatmentDialog
              open={isBulkTreatmentDialogOpen}
              onClose={() => {
                setIsBulkTreatmentDialogOpen(false)
                setSelectedCattleIds(new Set())
              }}
              selectedCattle={getSelectedCattle()}
              onComplete={() => {
                setSelectedCattleIds(new Set())
              }}
            />
          )}
        </>
      )}

      {/* Bulk Move Dialog */}
      <Dialog open={isBulkMoveDialogOpen} onOpenChange={setIsBulkMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedCattleIds.size} Cattle to Another Pen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Pen</Label>
              <Select value={targetPenId} onValueChange={setTargetPenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens
                    .filter(p => p.id !== pen?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.currentCount}/{p.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsBulkMoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkMoveToPen} disabled={!targetPenId}>
                <MoveRight className="h-4 w-4 mr-2" />
                Move Cattle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Weigh Dialog */}
      <Dialog open={isBulkWeighDialogOpen} onOpenChange={setIsBulkWeighDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Weight for {selectedCattleIds.size} Cattle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                placeholder="Enter weight in pounds"
                value={bulkWeight}
                onChange={(e) => setBulkWeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This weight will be recorded for all {selectedCattleIds.size} selected cattle
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsBulkWeighDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkWeigh} disabled={!bulkWeight}>
                <Weight className="h-4 w-4 mr-2" />
                Record Weight
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
