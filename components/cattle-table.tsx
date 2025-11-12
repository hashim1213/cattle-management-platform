"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreVertical, Edit, Trash2, Eye, Loader2, X } from "lucide-react"
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
  const { pens = [] } = usePenStore()
  const router = useRouter()

  const loadCattle = async () => {
    try {
      const data = await firebaseDataStore.getCattle()
      setCattle(data)
    } catch (error) {
      setCattle([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCattle()

    // Set up interval to refresh cattle data
    const interval = setInterval(() => {
      loadCattle()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
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
  }

  const handleBulkEditComplete = () => {
    setIsBulkEditOpen(false)
    clearSelection()
    loadCattle()
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
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedIds.size} cattle selected</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkEditOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredCattle.length && filteredCattle.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Visual Tag</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">RFID</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Breed</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Sex</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Weight</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Stage</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Health</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCattle.map((animal) => (
                  <tr
                    key={animal.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(animal.id)}
                        onCheckedChange={() => toggleSelect(animal.id)}
                      />
                    </td>
                    <td
                      className="p-4 font-medium text-foreground cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      {animal.tagNumber}
                    </td>
                    <td
                      className="p-4 text-xs font-mono text-muted-foreground cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      {animal.rfidTag ? animal.rfidTag : '-'}
                    </td>
                    <td
                      className="p-4 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      {animal.breed}
                    </td>
                    <td
                      className="p-4 cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      <Badge variant="outline" className="font-normal">
                        {animal.sex}
                      </Badge>
                    </td>
                    <td
                      className="p-4 text-sm font-medium text-foreground cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      {animal.weight} lbs
                    </td>
                    <td
                      className="p-4 cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
                      <Badge variant="secondary" className="capitalize font-normal">
                        {animal.stage}
                      </Badge>
                    </td>
                    <td
                      className="p-4 cursor-pointer"
                      onClick={() => router.push(`/cattle/${animal.id}`)}
                    >
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
                  </tr>
                ))}
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
