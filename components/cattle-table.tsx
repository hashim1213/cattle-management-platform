"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { dataStore, type Cattle } from "@/lib/data-store"

interface CattleTableProps {
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

export function CattleTable({ searchQuery, filters }: CattleTableProps) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const router = useRouter()

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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-foreground w-16"></th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Tag #</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Breed</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Sex</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Lot</th>
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
                  onClick={() => router.push(`/cattle/${animal.id}`)}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="relative w-10 h-10">
                      <Image src={getCattleIcon(animal.sex)} alt={animal.sex} fill className="object-contain" />
                    </div>
                  </td>
                  <td className="p-4 font-medium text-foreground">{animal.tagNumber}</td>
                  <td className="p-4 text-sm text-foreground">
                    {animal.name || <span className="text-muted-foreground italic">No name</span>}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{animal.breed}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="font-normal">
                      {animal.sex}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{animal.lot}</td>
                  <td className="p-4 text-sm font-medium text-foreground">{animal.weight} lbs</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="capitalize font-normal">
                      {animal.stage}
                    </Badge>
                  </td>
                  <td className="p-4">
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
  )
}
