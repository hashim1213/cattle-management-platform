"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface CattleTableProps {
  searchQuery: string
  filters: {
    status: string
    sex: string
    stage: string
    lot: string
  }
}

export function CattleTable({ searchQuery, filters }: CattleTableProps) {
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
      dailyGain: 2.8,
      daysOnFeed: 165,
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
      dailyGain: 3.1,
      daysOnFeed: 165,
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
      dailyGain: 1.2,
      daysOnFeed: 160,
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
      dailyGain: 2.9,
      daysOnFeed: 148,
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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Tag #</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Breed</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Sex</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Lot</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Weight</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Daily Gain</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Stage</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCattle.map((animal) => (
                <tr key={animal.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium text-foreground">{animal.tagNumber}</td>
                  <td className="p-4 text-sm text-foreground">{animal.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{animal.breed}</td>
                  <td className="p-4 text-sm text-muted-foreground capitalize">{animal.sex}</td>
                  <td className="p-4 text-sm text-muted-foreground">{animal.lotNumber}</td>
                  <td className="p-4 text-sm text-foreground">{animal.currentWeight} lbs</td>
                  <td className="p-4 text-sm text-foreground">{animal.dailyGain} lbs/day</td>
                  <td className="p-4 text-sm text-muted-foreground capitalize">{animal.stage}</td>
                  <td className="p-4">
                    <Badge
                      variant={animal.status === "healthy" ? "default" : "secondary"}
                      className={
                        animal.status === "healthy"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {animal.status === "healthy" ? "Healthy" : "Attention"}
                    </Badge>
                  </td>
                  <td className="p-4">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
