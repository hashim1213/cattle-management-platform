"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Grid3x3, Wheat, Syringe, DollarSign, Weight, MoveRight, Check, MoreVertical, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { usePenStore } from "@/hooks/use-pen-store"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { PenFeedDialog } from "@/components/pen-feed-dialog"
import { PenMedicationDialog } from "@/components/pen-medication-dialog"
import { BulkTreatmentDialog } from "@/components/bulk-treatment-dialog"
import { PenROICard } from "@/components/pen-roi-card"
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
  const [pen, setPen] = useState<any>(null)
  const [barn, setBarn] = useState<any>(null)
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [filteredCattle, setFilteredCattle] = useState<Cattle[]>([])
  const [cattleLoading, setCattleLoading] = useState(true)
  const [selectedCattleIds, setSelectedCattleIds] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const [isBulkTreatmentDialogOpen, setIsBulkTreatmentDialogOpen] = useState(false)
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false)
  const [isBulkWeighDialogOpen, setIsBulkWeighDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [penValue, setPenValue] = useState<string>("")

  // Bulk operation states
  const [targetPenId, setTargetPenId] = useState("")
  const [bulkWeight, setBulkWeight] = useState("")

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
        const penCattle = allCattle.filter(c => c.penId === params.id)
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
      for (const c of selectedCattle) {
        await firebaseDataStore.updateCattle(c.id, { penId: targetPenId })
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

  // Calculate total value from cattle
  const calculatedTotalValue = Array.isArray(cattle) ? cattle.reduce((sum, c) => {
    const marketPricePerPound = 1.65
    const cattleValue = c.currentValue || (c.weight * marketPricePerPound)
    return sum + cattleValue
  }, 0) : 0

  const displayTotalValue = pen?.totalValue ?? calculatedTotalValue

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

  const utilizationRate = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
  const available = pen.capacity - pen.currentCount
  const allSelected = filteredCattle.length > 0 && selectedCattleIds.size === filteredCattle.length
  const someSelected = selectedCattleIds.size > 0 && selectedCattleIds.size < filteredCattle.length

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
                  onClick={() => setIsFeedDialogOpen(true)}
                  className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
                >
                  <Wheat className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="sm:inline">Feed</span>
                </Button>
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

          {/* Info Cards */}
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

          {/* Cattle Management */}
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
        </div>
      </div>

      {/* Dialogs */}
      {pen && (
        <>
          <PenFeedDialog
            open={isFeedDialogOpen}
            onOpenChange={setIsFeedDialogOpen}
            pen={pen}
            onSuccess={() => {}}
          />

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
