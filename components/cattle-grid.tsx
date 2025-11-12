"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { firebaseDataStore as dataStore, type Cattle } from "@/lib/data-store-firebase"
import { usePenStore } from "@/hooks/use-pen-store"

interface CattleGridProps {
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

export function CattleGrid({ searchQuery, filters }: CattleGridProps) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [loading, setLoading] = useState(true)
  const { pens = [] } = usePenStore()
  const router = useRouter()

  useEffect(() => {
    const loadCattle = async () => {
      try {
        setLoading(true)
        const cattleData = await dataStore.getCattle()
        setCattle(Array.isArray(cattleData) ? cattleData : [])
      } catch (error) {
        console.error("Error loading cattle:", error)
        setCattle([])
      } finally {
        setLoading(false)
      }
    }

    loadCattle()

    // Subscribe to updates
    const unsubscribe = dataStore.subscribe(() => {
      const cattleData = dataStore.getCattle()
      // Only update if it's a valid array
      if (Array.isArray(cattleData)) {
        setCattle(cattleData)
      }
    })

    return unsubscribe
  }, [])

  // Defensive check to ensure cattle is always an array
  const safeCattle = Array.isArray(cattle) ? cattle : []

  const filteredCattle = safeCattle.filter((animal) => {
    const matchesSearch = searchQuery
      ? animal.tagNumber.includes(searchQuery) ||
        animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.lot.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading cattle...</p>
      </div>
    )
  }

  if (filteredCattle.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No cattle found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredCattle.map((animal) => (
        <Card
          key={animal.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push(`/cattle/${animal.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">
                  Tag #{animal.tagNumber}
                </h3>
                <p className="text-sm text-muted-foreground">{animal.breed} • {animal.sex}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{animal.breed}</Badge>
              <Badge variant="outline">{animal.sex}</Badge>
              <Badge variant="secondary" className="capitalize">
                {animal.stage}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium text-foreground">{animal.weight} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lot:</span>
                <span className="font-medium text-foreground">{animal.lot}</span>
              </div>
              {animal.pasture && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pasture:</span>
                  <span className="font-medium text-foreground">{animal.pasture}</span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Badge
                variant="default"
                className={`w-full justify-center ${
                  animal.healthStatus === "Healthy"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : animal.healthStatus === "Treatment"
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      : "bg-red-100 text-red-800 hover:bg-red-100"
                }`}
              >
                {animal.healthStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
