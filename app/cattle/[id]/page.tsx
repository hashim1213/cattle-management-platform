"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Edit, Trash2, Activity, TrendingUp, Calendar, DollarSign, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CattleDetailPage() {
  const params = useParams()
  const [isAddWeightOpen, setIsAddWeightOpen] = useState(false)
  const [isAddHealthOpen, setIsAddHealthOpen] = useState(false)
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false)

  // Mock data - would be fetched based on params.id
  const cattle = {
    id: params.id,
    tagNumber: "1247",
    name: "Big Red",
    breed: "Angus",
    sex: "steer",
    birthDate: "2023-03-15",
    purchaseDate: "2024-01-15",
    purchaseWeight: 785,
    currentWeight: 1245,
    purchasePrice: 1650,
    currentValue: 2490,
    targetSaleWeight: 1350,
    targetSalePrice: 2700,
    lotNumber: "LOT-A",
    status: "healthy",
    dailyGain: 2.8,
    daysOnFeed: 165,
    stage: "finishing",
    earTag: "1247",
    brand: "BR",
    colorMarkings: "Black with white face",
    hornStatus: "Polled",
    dam: "Tag #1100",
    sire: "Tag #2050",
    conceptionMethod: "Natural Breeding",
    notes: "Excellent weight gain, ready for market soon",
    readyForSale: true,
    estimatedDaysToTarget: 38,
  }

  const weightHistory = [
    { date: "2024-01-15", weight: 785, gain: 0 },
    { date: "2024-02-15", weight: 872, gain: 2.8 },
    { date: "2024-03-15", weight: 955, gain: 2.8 },
    { date: "2024-04-15", weight: 1042, gain: 2.9 },
    { date: "2024-05-15", weight: 1128, gain: 2.9 },
    { date: "2024-06-15", weight: 1245, gain: 3.9 },
  ]

  const healthRecords = [
    {
      date: "2024-06-01",
      type: "Vaccination",
      description: "Annual booster - IBR, BVD, PI3, BRSV",
      vet: "Dr. Smith",
      cost: 45,
      nextVisit: "2025-06-01",
    },
    {
      date: "2024-04-15",
      type: "Checkup",
      description: "Routine health check - all vitals normal",
      vet: "Dr. Johnson",
      cost: 75,
      nextVisit: null,
    },
    {
      date: "2024-02-01",
      type: "Treatment",
      description: "Minor foot issue resolved with antibiotics",
      vet: "Dr. Smith",
      cost: 120,
      nextVisit: "2024-02-15",
    },
  ]

  const lastVetVisit = healthRecords[0]
  const daysUntilNextVisit = lastVetVisit.nextVisit
    ? Math.ceil((new Date(lastVetVisit.nextVisit).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/cattle"
                className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cattle Inventory
              </Link>
              <div className="flex items-center gap-3 mt-2">
                <h1 className="text-2xl font-bold text-foreground">{cattle.name}</h1>
                <Badge variant="outline" className="text-base">
                  Tag #{cattle.tagNumber}
                </Badge>
                <Badge
                  className={
                    cattle.status === "healthy"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {cattle.status === "healthy" ? "Healthy" : "Needs Attention"}
                </Badge>
                {cattle.readyForSale && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ready for Sale</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {cattle.breed} • {cattle.sex} • {cattle.stage}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" className="text-destructive bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Weight</p>
                  <p className="text-2xl font-bold text-foreground">{cattle.currentWeight} lbs</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{cattle.currentWeight - cattle.purchaseWeight} lbs total
                  </p>
                </div>
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Daily Gain</p>
                  <p className="text-2xl font-bold text-foreground">{cattle.dailyGain} lbs</p>
                  <p className="text-xs text-muted-foreground mt-1">Per day average</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Days on Feed</p>
                  <p className="text-2xl font-bold text-foreground">{cattle.daysOnFeed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Since purchase</p>
                </div>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-foreground">${cattle.currentValue}</p>
                  <p className="text-xs text-green-600 mt-1">+${cattle.currentValue - cattle.purchasePrice} gain</p>
                </div>
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {cattle.readyForSale && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sale Readiness</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Target Weight</p>
                      <p className="font-semibold text-foreground">{cattle.targetSaleWeight} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Days to Target</p>
                      <p className="font-semibold text-foreground">{cattle.estimatedDaysToTarget} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Sale Price</p>
                      <p className="font-semibold text-foreground">${cattle.targetSalePrice}</p>
                    </div>
                  </div>
                </div>
                <Button>Mark as Sold</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Last Vet Visit</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">{lastVetVisit.date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-semibold text-foreground">{lastVetVisit.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Veterinarian</p>
                    <p className="font-semibold text-foreground">{lastVetVisit.vet}</p>
                  </div>
                  {daysUntilNextVisit && (
                    <div>
                      <p className="text-muted-foreground">Next Visit</p>
                      <p className="font-semibold text-foreground">
                        {daysUntilNextVisit > 0 ? `In ${daysUntilNextVisit} days` : "Overdue"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="weight">Weight History</TabsTrigger>
            <TabsTrigger value="health">Health Records</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Tag Number:</span>
                    <span className="font-medium text-foreground">{cattle.tagNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{cattle.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Breed:</span>
                    <span className="font-medium text-foreground">{cattle.breed}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Sex:</span>
                    <span className="font-medium text-foreground capitalize">{cattle.sex}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Birth Date:</span>
                    <span className="font-medium text-foreground">{cattle.birthDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Color/Markings:</span>
                    <span className="font-medium text-foreground">{cattle.colorMarkings}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Horn Status:</span>
                    <span className="font-medium text-foreground">{cattle.hornStatus}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Identification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Ear Tag:</span>
                    <span className="font-medium text-foreground">{cattle.earTag}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium text-foreground">{cattle.brand}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Lot Number:</span>
                    <span className="font-medium text-foreground">{cattle.lotNumber}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Life Stage:</span>
                    <span className="font-medium text-foreground capitalize">{cattle.stage}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Breeding Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Dam (Mother):</span>
                    <span className="font-medium text-foreground">{cattle.dam}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Sire (Father):</span>
                    <span className="font-medium text-foreground">{cattle.sire}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Conception Method:</span>
                    <span className="font-medium text-foreground">{cattle.conceptionMethod}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Purchase Date:</span>
                    <span className="font-medium text-foreground">{cattle.purchaseDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Purchase Weight:</span>
                    <span className="font-medium text-foreground">{cattle.purchaseWeight} lbs</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Purchase Price:</span>
                    <span className="font-medium text-foreground">${cattle.purchasePrice}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Price per lb:</span>
                    <span className="font-medium text-foreground">
                      ${(cattle.purchasePrice / cattle.purchaseWeight).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {cattle.notes && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{cattle.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weight" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Weight History</CardTitle>
                <Dialog open={isAddWeightOpen} onOpenChange={setIsAddWeightOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Weight
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Weight Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight-date">Date</Label>
                        <Input id="weight-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (lbs)</Label>
                        <Input id="weight" type="number" placeholder="1245" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight-notes">Notes (optional)</Label>
                        <Textarea id="weight-notes" placeholder="Any observations..." />
                      </div>
                      <Button className="w-full">Save Weight Record</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Weight</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Daily Gain</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Total Gain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {weightHistory.map((record, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="p-4 text-sm text-foreground">{record.date}</td>
                          <td className="p-4 text-sm font-medium text-foreground">{record.weight} lbs</td>
                          <td className="p-4 text-sm text-foreground">{record.gain} lbs/day</td>
                          <td className="p-4 text-sm text-green-600">+{record.weight - cattle.purchaseWeight} lbs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Health Records</CardTitle>
                <Dialog open={isAddHealthOpen} onOpenChange={setIsAddHealthOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Health Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="health-date">Date</Label>
                        <Input id="health-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-type">Type</Label>
                        <Input id="health-type" placeholder="Vaccination, Checkup, Treatment..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-description">Description</Label>
                        <Textarea id="health-description" placeholder="Details of the visit..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-vet">Veterinarian</Label>
                        <Input id="health-vet" placeholder="Dr. Smith" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-cost">Cost ($)</Label>
                        <Input id="health-cost" type="number" placeholder="75" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-next">Next Visit (optional)</Label>
                        <Input id="health-next" type="date" />
                      </div>
                      <Button className="w-full">Save Health Record</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthRecords.map((record, index) => (
                    <div key={index} className="flex gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="text-sm text-muted-foreground">{record.date}</span>
                          <span className="text-sm font-medium text-foreground ml-auto">${record.cost}</span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{record.description}</p>
                        <p className="text-xs text-muted-foreground">Veterinarian: {record.vet}</p>
                        {record.nextVisit && (
                          <p className="text-xs text-blue-600 mt-1">Next visit: {record.nextVisit}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Price & Value Tracking</CardTitle>
                  <Dialog open={isUpdatePriceOpen} onOpenChange={setIsUpdatePriceOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Update Price
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Current Value</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-value">Current Market Value ($)</Label>
                          <Input id="current-value" type="number" placeholder="2490" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price-notes">Notes (optional)</Label>
                          <Textarea id="price-notes" placeholder="Market conditions, buyer interest..." />
                        </div>
                        <Button className="w-full">Update Value</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
                        <p className="text-2xl font-bold text-foreground">${cattle.purchasePrice}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(cattle.purchasePrice / cattle.purchaseWeight).toFixed(2)}/lb
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                        <p className="text-2xl font-bold text-foreground">${cattle.currentValue}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(cattle.currentValue / cattle.currentWeight).toFixed(2)}/lb
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Gain</p>
                        <p className="text-2xl font-bold text-green-600">
                          +${cattle.currentValue - cattle.purchasePrice}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(((cattle.currentValue - cattle.purchasePrice) / cattle.purchasePrice) * 100).toFixed(1)}%
                          increase
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Target Sale Price</p>
                        <p className="text-2xl font-bold text-foreground">${cattle.targetSalePrice}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(cattle.targetSalePrice / cattle.targetSaleWeight).toFixed(2)}/lb
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Purchase Cost:</span>
                      <span className="font-medium text-foreground">${cattle.purchasePrice}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Feed Costs (est.):</span>
                      <span className="font-medium text-foreground">$485</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Health Costs:</span>
                      <span className="font-medium text-foreground">
                        ${healthRecords.reduce((sum, r) => sum + r.cost, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Other Costs:</span>
                      <span className="font-medium text-foreground">$125</span>
                    </div>
                    <div className="flex justify-between py-3 bg-muted/50 px-2 rounded">
                      <span className="font-semibold text-foreground">Total Investment:</span>
                      <span className="font-bold text-foreground">
                        ${cattle.purchasePrice + 485 + healthRecords.reduce((sum, r) => sum + r.cost, 0) + 125}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-green-50 px-2 rounded">
                      <span className="font-semibold text-foreground">Projected Profit:</span>
                      <span className="font-bold text-green-600">
                        $
                        {cattle.targetSalePrice -
                          (cattle.purchasePrice + 485 + healthRecords.reduce((sum, r) => sum + r.cost, 0) + 125)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
