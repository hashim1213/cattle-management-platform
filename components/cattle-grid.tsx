"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { dataStore, type Cattle } from "@/lib/data-store"

interface CattleGridProps {
  searchQuery: string
  filters: {
    status: string
    sex: string
    stage: string
    lot: string
  }
}

function getCattleIcon(sex: string) {
  switch (sex) {
    case "Bull":
      return "/images/bull.png"
    case "Cow":
      return "/images/cow.png"
    case "Steer":
    case "Heifer":
      return "/images/calf.png"
    default:
      return "/images/cow.png"
  }
}

export function CattleGrid({ searchQuery, filters }: CattleGridProps) {
  const [cattle, setCattle] = useState<Cattle[]>([])

  useEffect(() => {
    setCattle(dataStore.getCattle())
  }, [])

  const filteredCattle = cattle.filter((animal) => {
    const matchesSearch = searchQuery
      ? animal.tagNumber.includes(searchQuery) ||
        (animal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.lot.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    const matchesStatus = filters.status === "all" || animal.status === filters.status
    const matchesSex = filters.sex === "all" || animal.sex === filters.sex
    const matchesStage = filters.stage === "all" || animal.stage === filters.stage
    const matchesLot = filters.lot === "all" || animal.lot === filters.lot

    return matchesSearch && matchesStatus && matchesSex && matchesStage && matchesLot
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredCattle.map((animal) => (
        <Card key={animal.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image src={getCattleIcon(animal.sex)} alt={animal.sex} fill className="object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">
                  {animal.name || <span className="text-muted-foreground italic">No name</span>}
                </h3>
                <p className="text-sm text-muted-foreground">Tag #{animal.tagNumber}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
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
