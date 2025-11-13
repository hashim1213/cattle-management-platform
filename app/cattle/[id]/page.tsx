"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Trash2, Activity, TrendingUp, Calendar, DollarSign, Plus, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditCattleDialog } from "@/components/edit-cattle-dialog"
import { CattleGrowthTimeline } from "@/components/cattle-growth-timeline"
import { firebaseDataStore, type Cattle, type WeightRecord, type HealthRecord } from "@/lib/data-store-firebase"
import { feedService, type FeedAllocationRecord } from "@/lib/feed/feed-service"
import { usePenStore } from "@/hooks/use-pen-store"
import { useToast } from "@/hooks/use-toast"
import { useFarmSettings } from "@/hooks/use-farm-settings"

export default function CattleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { barns, pens, getPen, updatePenCount } = usePenStore()
  const { cattlePricePerLb } = useFarmSettings()
  const [isAddWeightOpen, setIsAddWeightOpen] = useState(false)
  const [isAddHealthOpen, setIsAddHealthOpen] = useState(false)
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false)
  const [isUpdateValueOpen, setIsUpdateValueOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignLocationOpen, setIsAssignLocationOpen] = useState(false)
  const [cattle, setCattle] = useState<Cattle | null>(null)
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [feedAllocations, setFeedAllocations] = useState<FeedAllocationRecord[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedBarnId, setSelectedBarnId] = useState<string>("")
  const [selectedPenId, setSelectedPenId] = useState<string>("")

  // Weight record form state
  const [weightDate, setWeightDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [weightValue, setWeightValue] = useState<string>("")
  const [weightNotes, setWeightNotes] = useState<string>("")

  // Value update form state
  const [newValue, setNewValue] = useState<string>("")

  useEffect(() => {
    const loadCattle = async () => {
      const allCattle = await firebaseDataStore.getCattle()
      const foundCattle = allCattle.find((c) => c.id === params.id)
      if (foundCattle) {
        setCattle(foundCattle)
        setSelectedBarnId(foundCattle.barnId || "")
        setSelectedPenId(foundCattle.penId || "")

        // Load weight records
        const weights = await firebaseDataStore.getWeightRecords(params.id as string)
        setWeightRecords(weights)

        // Load health records
        const health = await firebaseDataStore.getHealthRecords(params.id as string)
        setHealthRecords(health)

        // Load feed allocations (all allocations, filtered by pen in component)
        const allocations = feedService.getAllocations()
        setFeedAllocations(allocations)
      }
    }
    loadCattle()
  }, [params.id, refreshKey])

  const handleAddWeight = async () => {
    if (!cattle || !weightValue) {
      toast({
        title: "Error",
        description: "Please enter a weight value.",
        variant: "destructive",
      })
      return
    }

    try {
      // Add weight record to Firestore
      await firebaseDataStore.addWeightRecord(cattle.id, {
        date: weightDate,
        weight: Number(weightValue),
        notes: weightNotes || undefined,
      })

      // Update cattle's current weight
      await firebaseDataStore.updateCattle(cattle.id, {
        weight: Number(weightValue),
      })

      // Reset form and close dialog
      setWeightValue("")
      setWeightNotes("")
      setWeightDate(new Date().toISOString().split('T')[0])
      setIsAddWeightOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Weight recorded",
        description: "Weight record has been added successfully.",
      })
    } catch (error) {
      console.error("Failed to add weight record:", error)
      toast({
        title: "Error",
        description: "Failed to add weight record.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateValue = async () => {
    if (!cattle) {
      toast({
        title: "Error",
        description: "Cattle data not loaded.",
        variant: "destructive",
      })
      return
    }

    try {
      // If empty, set to undefined to use auto-calculation
      const valueToSet = newValue ? Number(newValue) : undefined

      await firebaseDataStore.updateCattle(cattle.id, {
        currentValue: valueToSet,
      })

      setNewValue("")
      setIsUpdateValueOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Value updated",
        description: valueToSet
          ? "Current value has been set to $" + valueToSet.toFixed(0)
          : "Value reset to automatic calculation",
      })
    } catch (error) {
      console.error("Failed to update value:", error)
      toast({
        title: "Error",
        description: "Failed to update value.",
        variant: "destructive",
      })
    }
  }

  const handleAssignLocation = async () => {
    if (!cattle) return

    const oldPenId = cattle.penId
    const newPenId = selectedPenId

    // Update cattle with new location
    await firebaseDataStore.updateCattle(cattle.id, {
      barnId: selectedBarnId,
      penId: newPenId,
    })

    // Update pen counts
    if (oldPenId && oldPenId !== newPenId) {
      updatePenCount(oldPenId, -1) // Remove from old pen
    }
    if (newPenId && oldPenId !== newPenId) {
      updatePenCount(newPenId, 1) // Add to new pen
    }

    setIsAssignLocationOpen(false)
    setRefreshKey(prev => prev + 1)
    toast({
      title: "Location updated",
      description: "Cattle has been assigned to the new location.",
    })
  }

  if (!cattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Calculate days on feed
  const daysOnFeed = cattle.purchaseDate || cattle.arrivalDate
    ? Math.floor((new Date().getTime() - new Date(cattle.purchaseDate || cattle.arrivalDate!).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Calculate daily gain
  const startWeight = cattle.purchaseWeight || cattle.arrivalWeight || 0
  const currentWeight = cattle.weight || 0
  const dailyGain = daysOnFeed > 0 ? (currentWeight - startWeight) / daysOnFeed : 0

  // Calculate current value (use manual value if set, otherwise calculate)
  const marketPricePerPound = cattlePricePerLb // Use configurable market price from settings
  const calculatedValue = currentWeight * marketPricePerPound
  const currentValue = cattle.currentValue || calculatedValue

  // Calculate target values
  const targetWeight = cattle.targetWeight || 0
  const targetValue = targetWeight * marketPricePerPound
  const estimatedDaysToTarget = dailyGain > 0 && targetWeight > currentWeight
    ? Math.ceil((targetWeight - currentWeight) / dailyGain)
    : 0
  const readyForSale = targetWeight > 0 && currentWeight >= targetWeight

  // Get current pen info
  const currentPen = cattle.penId ? getPen(cattle.penId) : null
  const currentBarn = cattle.barnId ? barns.find(b => b.id === cattle.barnId) : null

  // Convert weight records to weight history with daily gain calculations
  const sortedWeightRecords = [...weightRecords].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const weightHistory = sortedWeightRecords.map((record, index) => {
    if (index === 0) {
      return { date: record.date, weight: record.weight, gain: 0, notes: record.notes }
    }
    const prevRecord = sortedWeightRecords[index - 1]
    const daysBetween = Math.floor(
      (new Date(record.date).getTime() - new Date(prevRecord.date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const gain = daysBetween > 0 ? (record.weight - prevRecord.weight) / daysBetween : 0
    return { date: record.date, weight: record.weight, gain, notes: record.notes }
  })

  // Sort health records by date (most recent first)
  const sortedHealthRecords = [...healthRecords].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 lg:static backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/cattle"
                className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 touch-manipulation min-h-[44px] inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cattle Inventory
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Tag #{cattle.tagNumber}</h1>
                <Badge
                  className={
                    cattle.healthStatus === "Healthy"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {cattle.healthStatus}
                </Badge>
                {readyForSale && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ready for Sale</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
                {cattle.breed} • {cattle.sex} • {cattle.stage}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
              >
                <Edit className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                className="text-destructive bg-transparent touch-manipulation min-h-[44px] flex-1 sm:flex-none"
              >
                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Weight</p>
                  <p className="text-2xl font-bold text-foreground">{currentWeight} lbs</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{currentWeight - startWeight} lbs total
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
                  <p className="text-2xl font-bold text-foreground">{dailyGain.toFixed(2)} lbs</p>
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
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-foreground">${currentValue.toFixed(0)}</p>
                  <p className="text-xs text-green-600 mt-1">+${((cattle.purchasePrice || 0) > 0 ? (currentValue - (cattle.purchasePrice || 0)).toFixed(0) : 0)} gain</p>
                  {cattle.currentValue && (
                    <p className="text-xs text-muted-foreground mt-1">Manual value set</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewValue(currentValue.toString())
                      setIsUpdateValueOpen(true)
                    }}
                    className="touch-manipulation min-h-[40px] px-3"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Assignment */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  Current Location
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  {cattle.barnId && cattle.penId ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {barns.find(b => b.id === cattle.barnId)?.name || "Unknown Barn"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {pens.find(p => p.id === cattle.penId)?.name || "Unknown Pen"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">Unassigned</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAssignLocationOpen(true)}
                className="touch-manipulation min-h-[44px] w-full sm:w-auto flex-shrink-0"
              >
                {cattle.barnId ? "Change Location" : "Assign Location"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {readyForSale && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sale Readiness</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Target Weight</p>
                      <p className="font-semibold text-foreground">{targetWeight} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Days to Target</p>
                      <p className="font-semibold text-foreground">{estimatedDaysToTarget} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Sale Price</p>
                      <p className="font-semibold text-foreground">${targetValue.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
                <Button>Mark as Sold</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs - Mobile Optimized */}
        <Tabs defaultValue="growth" className="w-full">
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto pb-2 sm:pb-0">
            <TabsList className="inline-flex w-auto min-w-full sm:w-full">
              <TabsTrigger
                value="growth"
                className="flex-1 sm:flex-initial whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 touch-manipulation min-h-[44px]"
              >
                <span className="hidden lg:inline">Growth & Performance</span>
                <span className="lg:hidden">Growth</span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="flex-1 sm:flex-initial whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 touch-manipulation min-h-[44px]"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="weight"
                className="flex-1 sm:flex-initial whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 touch-manipulation min-h-[44px]"
              >
                <span className="hidden lg:inline">Weight History</span>
                <span className="lg:hidden">Weight</span>
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="flex-1 sm:flex-initial whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 touch-manipulation min-h-[44px]"
              >
                <span className="hidden lg:inline">Health Records</span>
                <span className="lg:hidden">Health</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex-1 sm:flex-initial whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 touch-manipulation min-h-[44px]"
              >
                Financial
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Growth Tab - NEW */}
          <TabsContent value="growth" className="mt-6">
            <CattleGrowthTimeline
              cattle={cattle}
              weightRecords={weightRecords}
              feedAllocations={feedAllocations}
              targetWeight={1350}
            />
          </TabsContent>

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
                        <Input
                          id="weight-date"
                          type="date"
                          value={weightDate}
                          onChange={(e) => setWeightDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (lbs)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="1245"
                          value={weightValue}
                          onChange={(e) => setWeightValue(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight-notes">Notes (optional)</Label>
                        <Textarea
                          id="weight-notes"
                          placeholder="Any observations..."
                          value={weightNotes}
                          onChange={(e) => setWeightNotes(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddWeight}>Save Weight Record</Button>
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
                {sortedHealthRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No health records yet.</p>
                    <p className="text-sm mt-2">Add your first health record to track veterinary care.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedHealthRecords.map((record) => (
                      <div key={record.id} className="flex gap-4 p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{record.type}</Badge>
                            <span className="text-sm text-muted-foreground">{record.date}</span>
                            {record.cost && (
                              <span className="text-sm font-medium text-foreground ml-auto">${record.cost}</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground mb-1">{record.description}</p>
                          {record.veterinarian && (
                            <p className="text-xs text-muted-foreground">Veterinarian: {record.veterinarian}</p>
                          )}
                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {record.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                        <p className="text-2xl font-bold text-foreground">${currentValue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(currentWeight > 0 ? (currentValue / currentWeight).toFixed(2) : "0.00")}/lb
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Gain</p>
                        <p className="text-2xl font-bold text-green-600">
                          +${((cattle.purchasePrice || 0) > 0 ? (currentValue - (cattle.purchasePrice || 0)).toFixed(0) : 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((cattle.purchasePrice || 0) > 0 ? (((currentValue - (cattle.purchasePrice || 0)) / (cattle.purchasePrice || 1)) * 100).toFixed(1) : 0)}%
                          increase
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Target Sale Price</p>
                        <p className="text-2xl font-bold text-foreground">${targetValue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(targetWeight > 0 ? (targetValue / targetWeight).toFixed(2) : "0.00")}/lb
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
                        ${healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Other Costs:</span>
                      <span className="font-medium text-foreground">$125</span>
                    </div>
                    <div className="flex justify-between py-3 bg-muted/50 px-2 rounded">
                      <span className="font-semibold text-foreground">Total Investment:</span>
                      <span className="font-bold text-foreground">
                        ${cattle.purchasePrice + 485 + healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0) + 125}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-green-50 px-2 rounded">
                      <span className="font-semibold text-foreground">Projected Profit:</span>
                      <span className="font-bold text-green-600">
                        $
                        {targetValue.toFixed(0) -
                          ((cattle.purchasePrice || 0) + 485 + healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0) + 125)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Cattle Dialog */}
      <EditCattleDialog
        cattle={cattle}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Assign Location Dialog */}
      <Dialog open={isAssignLocationOpen} onOpenChange={setIsAssignLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Barn & Pen Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign-barn">Barn</Label>
              <Select
                value={selectedBarnId}
                onValueChange={(value) => {
                  setSelectedBarnId(value)
                  setSelectedPenId("") // Reset pen when barn changes
                }}
              >
                <SelectTrigger id="assign-barn">
                  <SelectValue placeholder="Select barn" />
                </SelectTrigger>
                <SelectContent>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-pen">Pen</Label>
              <Select
                value={selectedPenId}
                onValueChange={setSelectedPenId}
                disabled={!selectedBarnId}
              >
                <SelectTrigger id="assign-pen">
                  <SelectValue placeholder="Select pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens
                    .filter((pen) => pen.barnId === selectedBarnId)
                    .map((pen) => {
                      const available = pen.capacity - pen.currentCount
                      return (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.name} ({available}/{pen.capacity} available)
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAssignLocationOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignLocation} disabled={!selectedPenId}>
                Assign Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Value Dialog */}
      <Dialog open={isUpdateValueOpen} onOpenChange={setIsUpdateValueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Current Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-value">Current Value ($)</Label>
              <Input
                id="new-value"
                type="number"
                placeholder="Enter current market value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty and save to reset to automatic calculation (weight × ${marketPricePerPound}/lb)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsUpdateValueOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateValue}>
                Update Value
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
