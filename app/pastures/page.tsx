"use client"

import { useState } from "react"
import { Plus, MapPin, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

export default function PasturesPage() {
  const [selectedPasture, setSelectedPasture] = useState<number | null>(null)

  // Mock data
  const pastures = [
    {
      id: 1,
      name: "North Pasture",
      acres: 45,
      cattleCount: 32,
      grassCondition: "excellent",
      lastRotation: "2024-06-15",
      daysGrazed: 15,
      estimatedDaysRemaining: 25,
      notes: "Good grass growth, ready for extended grazing",
    },
    {
      id: 2,
      name: "South Pasture",
      acres: 38,
      cattleCount: 28,
      grassCondition: "good",
      lastRotation: "2024-06-01",
      daysGrazed: 29,
      estimatedDaysRemaining: 11,
      notes: "Consider rotation in 2 weeks",
    },
    {
      id: 3,
      name: "East Pasture",
      acres: 52,
      cattleCount: 0,
      grassCondition: "recovering",
      lastRotation: "2024-05-10",
      daysGrazed: 0,
      estimatedDaysRemaining: 0,
      notes: "Resting, will be ready in 3 weeks",
    },
    {
      id: 4,
      name: "West Pasture",
      acres: 41,
      cattleCount: 35,
      grassCondition: "fair",
      lastRotation: "2024-05-28",
      daysGrazed: 33,
      estimatedDaysRemaining: 7,
      notes: "Plan rotation soon",
    },
  ]

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "good":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "fair":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100"
      case "recovering":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const totalAcres = pastures.reduce((sum, p) => sum + p.acres, 0)
  const totalCattle = pastures.reduce((sum, p) => sum + p.cattleCount, 0)
  const activePastures = pastures.filter((p) => p.cattleCount > 0).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Pasture Management</h1>
              <p className="text-sm text-muted-foreground">Track grazing rotation and grass conditions</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Pasture
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Acres</p>
                  <p className="text-2xl font-bold text-foreground">{totalAcres}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Pastures</p>
                  <p className="text-2xl font-bold text-foreground">
                    {activePastures} / {pastures.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <Image src="/images/cow.png" alt="Cattle" fill className="object-contain opacity-60" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cattle Grazing</p>
                  <p className="text-2xl font-bold text-foreground">{totalCattle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pastures Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {pastures.map((pasture) => (
            <Card key={pasture.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{pasture.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{pasture.acres} acres</p>
                  </div>
                  <Badge className={getConditionColor(pasture.grassCondition)}>{pasture.grassCondition}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cattle Count</p>
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        <Image src="/images/cow.png" alt="Cattle" fill className="object-contain opacity-60" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">{pasture.cattleCount}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Days Grazed</p>
                    <p className="text-lg font-semibold text-foreground">{pasture.daysGrazed}</p>
                  </div>
                </div>

                {pasture.cattleCount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Est. Days Remaining</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            pasture.estimatedDaysRemaining > 15
                              ? "bg-green-500"
                              : pasture.estimatedDaysRemaining > 7
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${(pasture.estimatedDaysRemaining / 40) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{pasture.estimatedDaysRemaining} days</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Last Rotation</p>
                  <p className="text-sm text-foreground">{pasture.lastRotation}</p>
                </div>

                {pasture.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">{pasture.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Move Cattle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
