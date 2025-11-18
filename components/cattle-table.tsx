"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreVertical, Edit, Trash2, Eye, Loader2, X, CheckSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { usePenStore } from "@/hooks/use-pen-store"
import { BulkEditDialog } from "@/components/bulk-edit-dialog"

interface CattleTableProps {
  searchQuery: string
  filters: {
    status: string
    sex: string
    stage: string
    healthStatus: string
    penId: string
    barnId: string
  }
}

export function CattleTable({ searchQuery, filters }: CattleTableProps) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const { pens = [] } = usePenStore()
  const router = useRouter()

  const loadCattle = async () => {
    try {
      const data = await firebaseDataStore.getCattle()
      setCattle(data)
    } catch (error) {
      console.error("Error loading cattle:", error)
      setCattle([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCattle()

    // Subscribe to real-time updates instead of polling
    const unsubscribe = firebaseDataStore.subscribe(async () => {
      await loadCattle()
    })

    return () => unsubscribe()
  }, [])

  const filteredCattle = cattle.filter((animal) => {
    const matchesSearch = searchQuery
      ? animal.tagNumber.includes(searchQuery) ||
        animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (animal.rfidTag && animal.rfidTag.includes(searchQuery))
      : true

    const matchesStatus = filters.status === "all" || animal.status === filters.status
    const matchesSex = filters.sex === "all" || animal.sex === filters.sex
    const matchesStage = filters.stage === "all" || animal.stage === filters.stage
    const matchesHealthStatus = filters.healthStatus === "all" || animal.healthStatus === filters.healthStatus
    const matchesPen = filters.penId === "all" || animal.penId === filters.penId

    // For barn filter, check if the animal's pen belongs to the selected barn
    const animalPen = pens.find(p => p.id === animal.penId)
    const matchesBarn = filters.barnId === "all" || (animalPen && animalPen.barnId === filters.barnId)

    return matchesSearch && matchesStatus && matchesSex && matchesStage && matchesHealthStatus && matchesPen && matchesBarn
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCattle.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCattle.map(c => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const handleBulkEditComplete = () => {
    setIsBulkEditOpen(false)
    clearSelection()
    loadCattle()
  }

  const enterSelectionMode = () => {
    setSelectionMode(true)
    setSelectedIds(new Set())
  }

  const handleRowClick = (animalId: string) => {
    if (selectionMode) {
      toggleSelect(animalId)
    } else {
      router.push(`/cattle/${animalId}`)
    }
  }

  const proceedToBulkEdit = () => {
    if (selectedIds.size > 0) {
      setIsBulkEditOpen(true)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Bulk Edit Mode Toolbar */}
      {!selectionMode ? (
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="default"
            size="default"
            onClick={enterSelectionMode}
            className="touch-manipulation min-h-[48px] px-6 gap-2 text-base font-semibold"
          >
            <CheckSquare className="h-5 w-5" />
            Bulk Edit Cattle
          </Button>
          <p className="text-sm text-muted-foreground">Select multiple cattle to edit at once</p>
        </div>
      ) : (
        <div className="mb-4 p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {selectedIds.size}
              </div>
              <div>
                <p className="font-semibold text-base sm:text-lg">
                  {selectedIds.size === 0 ? "Select cattle to edit" : `${selectedIds.size} cattle selected`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size === 0 ? "Tap any row to select cattle" : "Tap cattle to select/deselect, then click Edit Selected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                size="default"
                onClick={proceedToBulkEdit}
                disabled={selectedIds.size === 0}
                className="touch-manipulation min-h-[48px] flex-1 sm:flex-none px-6 gap-2 font-semibold"
              >
                <Edit className="h-5 w-5" />
                Edit Selected ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={clearSelection}
                className="touch-manipulation min-h-[48px] px-4"
              >
                <X className="h-5 w-5" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Cancel</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {selectionMode && (
                    <th className="p-4 w-12">
                      <Checkbox
                        checked={selectedIds.size === filteredCattle.length && filteredCattle.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Visual Tag</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">RFID</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Breed</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Sex</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Weight</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Stage</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Health</th>
                  {!selectionMode && (
                    <th className="text-left p-4 text-sm font-semibold text-foreground"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCattle.map((animal) => {
                  const isSelected = selectedIds.has(animal.id)
                  return (
                    <tr
                      key={animal.id}
                      onClick={() => handleRowClick(animal.id)}
                      className={`transition-all ${
                        selectionMode
                          ? `cursor-pointer hover:bg-primary/10 ${isSelected ? 'bg-primary/20 border-l-4 border-l-primary' : 'hover:bg-muted/50'}`
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {selectionMode && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(animal.id)}
                            className="h-5 w-5"
                          />
                        </td>
                      )}
                      <td className={`p-4 font-medium text-foreground ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        {animal.tagNumber}
                      </td>
                      <td className={`p-4 text-xs font-mono text-muted-foreground ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        {animal.rfidTag ? animal.rfidTag : '-'}
                      </td>
                      <td className={`p-4 text-sm text-muted-foreground ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        {animal.breed}
                      </td>
                      <td className={`p-4 ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        <Badge variant="outline" className="font-normal">
                          {animal.sex}
                        </Badge>
                      </td>
                      <td className={`p-4 text-sm font-medium text-foreground ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        {animal.weight} lbs
                      </td>
                      <td className={`p-4 ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        <Badge variant="secondary" className="capitalize font-normal">
                          {animal.stage}
                        </Badge>
                      </td>
                      <td className={`p-4 ${!selectionMode ? 'cursor-pointer' : ''}`}>
                        <Badge
                          variant="default"
                          className={
                            animal.healthStatus === "Healthy"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : animal.healthStatus === "Treatment"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {animal.healthStatus}
                        </Badge>
                      </td>
                      {!selectionMode && (
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/cattle/${animal.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <BulkEditDialog
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        selectedIds={Array.from(selectedIds)}
        onComplete={handleBulkEditComplete}
      />
    </>
  )
}
