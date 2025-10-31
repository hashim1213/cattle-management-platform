"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface CattleGridProps {
  searchQuery: string
  filters: {
    status: string
    sex: string
    stage: string
    lot: string
  }
}

export function CattleGrid({ searchQuery, filters }: CattleGridProps) {
  const [cattle] = useState([
    {
      id: 1,
      tagNumber: "1247",
      name: "Big Red",
      breed: "Angus",
      sex: "steer",
      birthDate: "2023-03-15",
      purchaseDate: "2024-01-15",
      purchaseWeight: 785,
      currentWeight: 1245,
      purchasePrice: 1650,
      lotNumber: "LOT-A",
      status: "healthy",
      stage: "finishing",
      earTag: "1247",
      brand: "BR",
    },
    {
      id: 2,
      tagNumber: "1248",
      name: "Bessie",
      breed: "Hereford",
      sex: "heifer",
      birthDate: "2023-03-20",
      purchaseDate: "2024-01-15",
      purchaseWeight: 765,
      currentWeight: 1189,
      purchasePrice: 1620,
      lotNumber: "LOT-A",
      status: "healthy",
      stage: "yearling",
      earTag: "1248",
      brand: "BR",
    },
    {
      id: 3,
      tagNumber: "1249",
      name: "Thunder",
      breed: "Angus",
      sex: "bull",
      birthDate: "2023-02-10",
      purchaseDate: "2024-01-20",
      purchaseWeight: 802,
      currentWeight: 1098,
      purchasePrice: 1685,
      lotNumber: "LOT-A",
      status: "attention",
      stage: "breeding",
      earTag: "1249",
      brand: "TH",
    },
    {
      id: 4,
      tagNumber: "1250",
      name: "Daisy",
      breed: "Charolais",
      sex: "cow",
      birthDate: "2022-04-15",
      purchaseDate: "2024-02-01",
      purchaseWeight: 795,
      currentWeight: 1156,
      purchasePrice: 1670,
      lotNumber: "LOT-B",
      status: "healthy",
      stage: "breeding",
      earTag: "1250",
      brand: "DS",
    },
  ])

  const filteredCattle = cattle.filter((animal) => {
    const matchesSearch = searchQuery
      ? animal.tagNumber.includes(searchQuery) ||
        animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.lotNumber.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    const matchesStatus = filters.status === "all" || animal.status === filters.status
    const matchesSex = filters.sex === "all" || animal.sex === filters.sex
    const matchesStage = filters.stage === "all" || animal.stage === filters.stage
    const matchesLot = filters.lot === "all" || animal.lotNumber === filters.lot

    return matchesSearch && matchesStatus && matchesSex && matchesStage && matchesLot
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredCattle.map((animal) => (
        <Card key={animal.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">{animal.name}</h3>
                <p className="text-sm text-muted-foreground">Tag #{animal.tagNumber}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
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
            <div className="flex gap-2">
              <Badge variant="outline">{animal.breed}</Badge>
              <Badge variant="outline" className="capitalize">
                {animal.sex}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Weight:</span>
                <span className="font-medium text-foreground">{animal.currentWeight} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lot:</span>
                <span className="font-medium text-foreground">{animal.lotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage:</span>
                <span className="font-medium text-foreground capitalize">{animal.stage}</span>
              </div>
            </div>
            <div className="pt-2">
              <Badge
                variant={animal.status === "healthy" ? "default" : "secondary"}
                className={
                  animal.status === "healthy"
                    ? "bg-green-100 text-green-800 hover:bg-green-100 w-full justify-center"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-100 w-full justify-center"
                }
              >
                {animal.status === "healthy" ? "Healthy" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
