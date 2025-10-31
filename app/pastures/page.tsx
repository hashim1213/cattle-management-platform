"use client"

import { useState } from "react"
import { Plus, MapPin, Sprout, Calendar, ArrowRight, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"

export default function PasturesPage() {
  const [selectedPasture, setSelectedPasture] = useState<number | null>(null)
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false)
  const [rotateFrom, setRotateFrom] = useState<number | null>(null)
  const [rotateTo, setRotateTo] = useState<number | null>(null)
  const [isAddPastureOpen, setIsAddPastureOpen] = useState(false)
  const [isEditPastureOpen, setIsEditPastureOpen] = useState(false)
  const [editingPasture, setEditingPasture] = useState<number | null>(null)

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
            <Button onClick={() => setIsAddPastureOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pasture
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-green-500 flex items-center justify-center shadow-md">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Total Acres</p>
                  <p className="text-3xl font-bold text-green-900">{totalAcres}</p>
                  <p className="text-xs text-green-700">Under management</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                  <Sprout className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Active Pastures</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {activePastures} / {pastures.length}
                  </p>
                  <p className="text-xs text-blue-700">Currently in use</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14">
                  <Image src="/images/cow.png" alt="Cattle" fill className="object-contain opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Cattle Grazing</p>
                  <p className="text-3xl font-bold text-amber-900">{totalCattle}</p>
                  <p className="text-xs text-amber-700">Head on pasture</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pastures Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {pastures.map((pasture) => (
            <Card key={pasture.id} className="hover:shadow-xl transition-all border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{pasture.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{pasture.acres} acres</p>
                    </div>
                  </div>
                  <Badge className={getConditionColor(pasture.grassCondition)}>{pasture.grassCondition}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Cattle Count</p>
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7">
                        <Image src="/images/cow.png" alt="Cattle" fill className="object-contain opacity-60" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{pasture.cattleCount}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Days Grazed</p>
                    <p className="text-2xl font-bold text-foreground">{pasture.daysGrazed}</p>
                  </div>
                </div>

                {pasture.cattleCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-foreground">Grazing Time Remaining</p>
                      <span className="text-sm font-bold text-foreground">{pasture.estimatedDaysRemaining} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-3 border border-border">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pasture.estimatedDaysRemaining > 15
                              ? "bg-green-500"
                              : pasture.estimatedDaysRemaining > 7
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min((pasture.estimatedDaysRemaining / 40) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Rotation:</span>
                    <span className="font-medium text-foreground">{pasture.lastRotation}</span>
                  </div>
                </div>

                {pasture.notes && (
                  <div className="pt-2 border-t border-border bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-900 italic">{pasture.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setRotateFrom(pasture.id)
                      setIsRotateDialogOpen(true)
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Rotate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingPasture(pasture.id)
                      setIsEditPastureOpen(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Rotation Tool */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Quick Rotation Planner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Plan your next cattle rotation to optimize grazing and pasture recovery
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="from-pasture">From Pasture</Label>
                <Select value={rotateFrom?.toString()} onValueChange={(val) => setRotateFrom(parseInt(val))}>
                  <SelectTrigger id="from-pasture">
                    <SelectValue placeholder="Select pasture" />
                  </SelectTrigger>
                  <SelectContent>
                    {pastures
                      .filter((p) => p.cattleCount > 0)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} ({p.cattleCount} head)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-pasture">To Pasture</Label>
                <Select value={rotateTo?.toString()} onValueChange={(val) => setRotateTo(parseInt(val))}>
                  <SelectTrigger id="to-pasture">
                    <SelectValue placeholder="Select pasture" />
                  </SelectTrigger>
                  <SelectContent>
                    {pastures
                      .filter((p) => p.id !== rotateFrom)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} ({p.acres} acres)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-4" disabled={!rotateFrom || !rotateTo}>
              Execute Rotation
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Rotation Dialog */}
      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Cattle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Pasture</Label>
              <Select value={rotateFrom?.toString()} onValueChange={(val) => setRotateFrom(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source pasture" />
                </SelectTrigger>
                <SelectContent>
                  {pastures
                    .filter((p) => p.cattleCount > 0)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} ({p.cattleCount} head)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Pasture</Label>
              <Select value={rotateTo?.toString()} onValueChange={(val) => setRotateTo(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination pasture" />
                </SelectTrigger>
                <SelectContent>
                  {pastures
                    .filter((p) => p.id !== rotateFrom)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} - {p.grassCondition} ({p.acres} acres)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Cattle to Move</Label>
              <Input type="number" placeholder="Enter number of cattle" />
            </div>
            <div className="space-y-2">
              <Label>Rotation Date</Label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <Button className="w-full" disabled={!rotateFrom || !rotateTo}>
              Confirm Rotation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pasture Dialog */}
      <Dialog open={isAddPastureOpen} onOpenChange={setIsAddPastureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Pasture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pasture-name">Pasture Name *</Label>
                <Input id="pasture-name" placeholder="e.g., North Pasture" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pasture-acres">Acres *</Label>
                <Input id="pasture-acres" type="number" placeholder="e.g., 45" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grass-condition">Grass Condition</Label>
                <Select>
                  <SelectTrigger id="grass-condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cattle-count">Current Cattle Count</Label>
                <Input id="cattle-count" type="number" placeholder="0" defaultValue="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pasture-notes">Notes (Optional)</Label>
              <Input id="pasture-notes" placeholder="e.g., Recently fertilized, good water access" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last-rotation">Last Rotation Date</Label>
                <Input id="last-rotation" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days-grazed">Days Grazed</Label>
                <Input id="days-grazed" type="number" placeholder="0" defaultValue="0" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Pasture Management Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Rotate cattle every 30-45 days for optimal grass recovery</li>
                <li>• Monitor grass condition regularly and adjust stocking rates</li>
                <li>• Allow 60-90 days rest for recovering pastures</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddPastureOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Pasture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pasture Dialog */}
      <Dialog open={isEditPastureOpen} onOpenChange={setIsEditPastureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pasture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingPasture && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pasture-name">Pasture Name *</Label>
                    <Input
                      id="edit-pasture-name"
                      defaultValue={pastures.find((p) => p.id === editingPasture)?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pasture-acres">Acres *</Label>
                    <Input
                      id="edit-pasture-acres"
                      type="number"
                      defaultValue={pastures.find((p) => p.id === editingPasture)?.acres}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-grass-condition">Grass Condition</Label>
                    <Select defaultValue={pastures.find((p) => p.id === editingPasture)?.grassCondition}>
                      <SelectTrigger id="edit-grass-condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="recovering">Recovering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cattle-count">Current Cattle Count</Label>
                    <Input
                      id="edit-cattle-count"
                      type="number"
                      defaultValue={pastures.find((p) => p.id === editingPasture)?.cattleCount}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-pasture-notes">Notes</Label>
                  <Input
                    id="edit-pasture-notes"
                    defaultValue={pastures.find((p) => p.id === editingPasture)?.notes}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-last-rotation">Last Rotation Date</Label>
                    <Input
                      id="edit-last-rotation"
                      type="date"
                      defaultValue={pastures.find((p) => p.id === editingPasture)?.lastRotation}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-days-grazed">Days Grazed</Label>
                    <Input
                      id="edit-days-grazed"
                      type="number"
                      defaultValue={pastures.find((p) => p.id === editingPasture)?.daysGrazed}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Current Status:</strong>{" "}
                    {pastures.find((p) => p.id === editingPasture)?.cattleCount || 0} cattle,{" "}
                    {pastures.find((p) => p.id === editingPasture)?.estimatedDaysRemaining || 0} days remaining
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditPastureOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1">Save Changes</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
