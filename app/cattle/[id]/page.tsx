"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Trash2, Activity, TrendingUp, Calendar, DollarSign, Plus, Building2, MapPin, Pill, Wheat, AlertTriangle, Skull } from "lucide-react"
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
import { MortalityTrackingDialog } from "@/components/mortality-tracking-dialog"
import { firebaseDataStore, type Cattle, type WeightRecord, type HealthRecord } from "@/lib/data-store-firebase"
import { feedService, type FeedAllocationRecord } from "@/lib/feed/feed-service"
import { cattleCostService, type CattleCostSummary } from "@/lib/cattle-cost-service"
import { penActivityStore } from "@/lib/pen-activity-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useToast } from "@/hooks/use-toast"
import { useFarmSettings } from "@/hooks/use-farm-settings"

export default function CattleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { barns, pens, getPen, updatePenCount } = usePenStore()
  const { cattlePricePerLb, targetDailyGain } = useFarmSettings()
  const [isAddWeightOpen, setIsAddWeightOpen] = useState(false)
  const [isAddHealthOpen, setIsAddHealthOpen] = useState(false)
  const [isUpdateValueOpen, setIsUpdateValueOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignLocationOpen, setIsAssignLocationOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMortalityDialogOpen, setIsMortalityDialogOpen] = useState(false)
  const [isDiseaseDialogOpen, setIsDiseaseDialogOpen] = useState(false)
  const [cattle, setCattle] = useState<Cattle | null>(null)
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [feedAllocations, setFeedAllocations] = useState<FeedAllocationRecord[]>([])
  const [costSummary, setCostSummary] = useState<CattleCostSummary | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedBarnId, setSelectedBarnId] = useState<string>("")
  const [selectedPenId, setSelectedPenId] = useState<string>("")

  // Weight record form state
  const [weightDate, setWeightDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [weightValue, setWeightValue] = useState<string>("")
  const [weightNotes, setWeightNotes] = useState<string>("")

  // Value update form state
  const [newValue, setNewValue] = useState<string>("")

  // Health record form state
  const [healthDate, setHealthDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [healthType, setHealthType] = useState<string>("Vaccination")
  const [healthDescription, setHealthDescription] = useState<string>("")
  const [healthVet, setHealthVet] = useState<string>("")
  const [healthCost, setHealthCost] = useState<string>("")
  const [healthNotes, setHealthNotes] = useState<string>("")
  const [healthNextVisit, setHealthNextVisit] = useState<string>("")

  // Feed record form state
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [feedType, setFeedType] = useState<string>("")
  const [feedAmount, setFeedAmount] = useState<string>("")
  const [feedUnit, setFeedUnit] = useState<string>("lbs")
  const [feedCost, setFeedCost] = useState<string>("")
  const [feedNotes, setFeedNotes] = useState<string>("")

  // Medication record form state
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [medicationDate, setMedicationDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [medicationName, setMedicationName] = useState<string>("")
  const [medicationDosage, setMedicationDosage] = useState<string>("")
  const [medicationUnit, setMedicationUnit] = useState<string>("ml")
  const [medicationPurpose, setMedicationPurpose] = useState<string>("Treatment")
  const [medicationCost, setMedicationCost] = useState<string>("")
  const [medicationWithdrawal, setMedicationWithdrawal] = useState<string>("")
  const [medicationNotes, setMedicationNotes] = useState<string>("")

  // Disease tracking form state
  const [diseaseStatus, setDiseaseStatus] = useState<string>("Sick")
  const [diseaseNotes, setDiseaseNotes] = useState<string>("")

  useEffect(() => {
    const loadCattle = async () => {
      try {
        // Load all data in parallel for much faster page load (3-5x faster)
        const [
          , // penActivityStore.loadFeedActivities result (void)
          , // penActivityStore.loadMedicationActivities result (void)
          allCattle,
          weights,
          health,
          costs
        ] = await Promise.all([
          penActivityStore.loadFeedActivities(),
          penActivityStore.loadMedicationActivities(),
          firebaseDataStore.getCattle(),
          firebaseDataStore.getWeightRecords(params.id as string),
          firebaseDataStore.getHealthRecords(params.id as string),
          cattleCostService.getCattleCostSummary(params.id as string),
        ])

        const foundCattle = allCattle.find((c) => c.id === params.id)
        if (foundCattle) {
          setCattle(foundCattle)
          setSelectedBarnId(foundCattle.barnId || "")
          setSelectedPenId(foundCattle.penId || "")
          setWeightRecords(weights)
          setHealthRecords(health)

          // Load feed allocations (synchronous operation)
          const allocations = feedService.getAllocations()
          setFeedAllocations(allocations)

          setCostSummary(costs)
        }
      } catch (error) {
        console.error("Error loading cattle data:", error)
        toast({
          title: "Error",
          description: "Failed to load cattle data. Please refresh the page.",
          variant: "destructive",
        })
      }
    }
    loadCattle()
  }, [params.id, refreshKey, toast])

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

  const handleAddHealthRecord = async () => {
    if (!cattle || !healthType || !healthDescription) {
      toast({
        title: "Error",
        description: "Please fill in type and description fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const notes = [healthNotes, healthNextVisit ? `Next visit: ${healthNextVisit}` : ""]
        .filter(Boolean)
        .join(" | ")

      await firebaseDataStore.addHealthRecord(cattle.id, {
        date: healthDate,
        type: healthType as "Vaccination" | "Treatment" | "Checkup" | "Surgery" | "Other",
        description: healthDescription,
        veterinarian: healthVet || undefined,
        cost: healthCost ? Number(healthCost) : undefined,
        notes: notes || undefined,
      })

      // Reset form
      setHealthDate(new Date().toISOString().split('T')[0])
      setHealthType("Vaccination")
      setHealthDescription("")
      setHealthVet("")
      setHealthCost("")
      setHealthNotes("")
      setHealthNextVisit("")
      setIsAddHealthOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Health record added",
        description: "Health record has been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to add health record:", error)
      toast({
        title: "Error",
        description: "Failed to add health record.",
        variant: "destructive",
      })
    }
  }

  const handleAddFeedRecord = async () => {
    if (!cattle || !feedType || !feedAmount) {
      toast({
        title: "Error",
        description: "Please fill in feed type and amount.",
        variant: "destructive",
      })
      return
    }

    try {
      // Add individual feed record to health records with type "Other" and special marker in notes
      await firebaseDataStore.addHealthRecord(cattle.id, {
        date: feedDate,
        type: "Other",
        description: `Feed: ${feedType} - ${feedAmount} ${feedUnit}`,
        cost: feedCost ? Number(feedCost) : undefined,
        notes: feedNotes ? `[FEED] ${feedNotes}` : "[FEED]",
      })

      // Reset form
      setFeedDate(new Date().toISOString().split('T')[0])
      setFeedType("")
      setFeedAmount("")
      setFeedUnit("lbs")
      setFeedCost("")
      setFeedNotes("")
      setFeedDialogOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Feed record added",
        description: "Individual feed record has been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to add feed record:", error)
      toast({
        title: "Error",
        description: "Failed to add feed record.",
        variant: "destructive",
      })
    }
  }

  const handleAddMedicationRecord = async () => {
    if (!cattle || !medicationName || !medicationDosage) {
      toast({
        title: "Error",
        description: "Please fill in medication name and dosage.",
        variant: "destructive",
      })
      return
    }

    try {
      // Add individual medication record to health records with type "Treatment" and special marker in notes
      const description = `Medication: ${medicationName} - ${medicationDosage} ${medicationUnit} - ${medicationPurpose}`
      const noteParts = [
        "[MEDICATION]",
        medicationNotes,
        medicationWithdrawal ? `Withdrawal: ${medicationWithdrawal} days` : ""
      ].filter(Boolean)

      await firebaseDataStore.addHealthRecord(cattle.id, {
        date: medicationDate,
        type: "Treatment",
        description,
        cost: medicationCost ? Number(medicationCost) : undefined,
        notes: noteParts.join(" | "),
      })

      // Reset form
      setMedicationDate(new Date().toISOString().split('T')[0])
      setMedicationName("")
      setMedicationDosage("")
      setMedicationUnit("ml")
      setMedicationPurpose("Treatment")
      setMedicationCost("")
      setMedicationWithdrawal("")
      setMedicationNotes("")
      setMedicationDialogOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Medication record added",
        description: "Individual medication record has been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to add medication record:", error)
      toast({
        title: "Error",
        description: "Failed to add medication record.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsDiseased = async () => {
    if (!cattle) return

    try {
      await firebaseDataStore.updateCattle(cattle.id, {
        healthStatus: diseaseStatus as "Healthy" | "Sick" | "Treatment" | "Quarantine",
      })

      // Add health record to track when the disease status was changed
      await firebaseDataStore.addHealthRecord(cattle.id, {
        date: new Date().toISOString().split('T')[0],
        type: "Treatment",
        description: `Health status changed to: ${diseaseStatus}`,
        notes: diseaseNotes || undefined,
      })

      setDiseaseNotes("")
      setIsDiseaseDialogOpen(false)
      setRefreshKey(prev => prev + 1)

      toast({
        title: "Health status updated",
        description: `Cattle marked as ${diseaseStatus.toLowerCase()}.`,
      })
    } catch (error) {
      console.error("Failed to update health status:", error)
      toast({
        title: "Error",
        description: "Failed to update health status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCattle = async () => {
    if (!cattle) return

    setIsDeleting(true)
    try {
      // Delete the cattle record
      await firebaseDataStore.deleteCattle(cattle.id)

      // Update pen count if cattle was assigned to a pen
      if (cattle.penId) {
        updatePenCount(cattle.penId, -1)
      }

      toast({
        title: "Cattle deleted",
        description: `Cattle #${cattle.tagNumber} has been deleted successfully.`,
      })

      // Navigate back to cattle list
      router.push("/cattle")
    } catch (error) {
      console.error("Failed to delete cattle:", error)
      toast({
        title: "Error",
        description: "Failed to delete cattle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
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
  const sortedWeightRecords = (weightRecords || []).slice().sort((a, b) =>
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
  const sortedHealthRecords = (healthRecords || []).slice().sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 lg:static backdrop-blur-md bg-card/95">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-5">
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <Link
                href="/cattle"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1.5 touch-manipulation min-h-[40px] inline-flex active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cattle Inventory
              </Link>
              <div className="flex items-start gap-2 mt-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Tag #{cattle.tagNumber}</h1>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge
                    className={
                      cattle.healthStatus === "Healthy"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs px-2 py-0.5"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs px-2 py-0.5"
                    }
                  >
                    {cattle.healthStatus}
                  </Badge>
                  {readyForSale && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs px-2 py-0.5">Ready for Sale</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                {cattle.breed} • {cattle.sex} • {cattle.stage}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="touch-manipulation min-h-[44px] flex-1 sm:flex-none active:scale-95 transition-transform text-sm"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span>Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:bg-destructive/10 touch-manipulation min-h-[44px] flex-1 sm:flex-none active:scale-95 transition-transform text-sm"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-6 py-3 sm:py-6 pb-20 md:pb-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Current Weight</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{currentWeight} lbs</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    +{(currentWeight - startWeight).toFixed(0)} lbs total
                  </p>
                </div>
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Daily Gain</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{dailyGain.toFixed(2)} lbs</p>
                  <p className="text-xs text-muted-foreground mt-1">Per day average</p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Current Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">${currentValue.toFixed(0)}</p>
                  <p className="text-xs text-green-600 mt-1">+${((cattle.purchasePrice || 0) > 0 ? (currentValue - (cattle.purchasePrice || 0)).toFixed(0) : "0")} gain</p>
                  {cattle.currentValue && (
                    <p className="text-xs text-muted-foreground mt-1">Manual value set</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewValue(currentValue.toString())
                      setIsUpdateValueOpen(true)
                    }}
                    className="touch-manipulation min-h-[36px] px-2 text-xs"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Status & Disease Tracking */}
        <Card className="mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 flex-shrink-0" />
                  Health & Status
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Health:</span>
                    <Badge
                      className={
                        cattle.healthStatus === "Healthy"
                          ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs"
                          : cattle.healthStatus === "Sick"
                          ? "bg-red-100 text-red-800 hover:bg-red-100 text-xs"
                          : cattle.healthStatus === "Treatment"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs"
                          : "bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs"
                      }
                    >
                      {cattle.healthStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-xs">{cattle.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsDiseaseDialogOpen(true)}
                  className="touch-manipulation min-h-[40px] flex-1 sm:flex-none text-xs sm:text-sm"
                  disabled={cattle.status === "Deceased"}
                >
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Update
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsMortalityDialogOpen(true)}
                  className="text-destructive bg-transparent touch-manipulation min-h-[40px] flex-1 sm:flex-none text-xs sm:text-sm"
                  disabled={cattle.status === "Deceased"}
                >
                  <Skull className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Assignment */}
        <Card className="mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  Current Location
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
                  {cattle.barnId && cattle.penId ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {barns.find(b => b.id === cattle.barnId)?.name || "Unknown Barn"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {pens.find(p => p.id === cattle.penId)?.name || "Unknown Pen"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 text-xs">Unassigned</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAssignLocationOpen(true)}
                className="touch-manipulation min-h-[40px] w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
              >
                {cattle.barnId ? "Change Location" : "Assign Location"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {readyForSale && (
          <Card className="mb-3 sm:mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">Sale Readiness</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">Target Weight</p>
                      <p className="font-semibold text-foreground">{targetWeight} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Days</p>
                      <p className="font-semibold text-foreground">{estimatedDaysToTarget} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Price</p>
                      <p className="font-semibold text-foreground">${targetValue.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full sm:w-auto text-xs sm:text-sm">Mark as Sold</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs - Mobile Optimized */}
        <Tabs defaultValue="growth" className="w-full">
          <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto pb-1.5 sm:pb-0">
            <TabsList className="inline-flex w-auto min-w-full sm:w-full h-9 sm:h-10">
              <TabsTrigger
                value="growth"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                <span className="hidden lg:inline">Growth & Performance</span>
                <span className="lg:hidden">Growth</span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="weight"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                <span className="hidden lg:inline">Weight History</span>
                <span className="lg:hidden">Weight</span>
              </TabsTrigger>
              <TabsTrigger
                value="feed"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                <span className="hidden lg:inline">Feed History</span>
                <span className="lg:hidden">Feed</span>
              </TabsTrigger>
              <TabsTrigger
                value="medication"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                <span className="hidden lg:inline">Medications</span>
                <span className="lg:hidden">Meds</span>
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                <span className="hidden lg:inline">Health Records</span>
                <span className="lg:hidden">Health</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex-1 sm:flex-initial whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-3 touch-manipulation"
              >
                Financial
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Growth Tab - NEW */}
          <TabsContent value="growth" className="mt-3 sm:mt-4">
            <CattleGrowthTimeline
              cattle={cattle}
              weightRecords={weightRecords}
              feedAllocations={feedAllocations}
              targetWeight={1350}
              targetDailyGain={targetDailyGain}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-3 sm:mt-4">
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
                      ${cattle.purchasePrice && cattle.purchaseWeight ? (cattle.purchasePrice / cattle.purchaseWeight).toFixed(2) : "N/A"}
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

          <TabsContent value="weight" className="mt-3 sm:mt-4">
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
                          <td className="p-4 text-sm text-foreground">{record.gain.toFixed(2)} lbs/day</td>
                          <td className="p-4 text-sm text-green-600">+{cattle.purchaseWeight ? (record.weight - cattle.purchaseWeight).toFixed(0) : record.weight} lbs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feed" className="mt-3 sm:mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wheat className="h-5 w-5" />
                    Feed History
                  </CardTitle>
                  {currentPen && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing feed allocations for {currentPen.name}. Costs are calculated per head.
                    </p>
                  )}
                </div>
                <Dialog open={feedDialogOpen} onOpenChange={setFeedDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feed
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Individual Feed Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="feed-date">Date</Label>
                        <Input
                          id="feed-date"
                          type="date"
                          value={feedDate}
                          onChange={(e) => setFeedDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feed-type">Feed Type</Label>
                        <Input
                          id="feed-type"
                          placeholder="e.g., Hay, Corn, Supplements"
                          value={feedType}
                          onChange={(e) => setFeedType(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="feed-amount">Amount</Label>
                          <Input
                            id="feed-amount"
                            type="number"
                            placeholder="50"
                            value={feedAmount}
                            onChange={(e) => setFeedAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feed-unit">Unit</Label>
                          <Select value={feedUnit} onValueChange={setFeedUnit}>
                            <SelectTrigger id="feed-unit">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lbs">lbs</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="bales">bales</SelectItem>
                              <SelectItem value="flakes">flakes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feed-cost">Cost ($) (optional)</Label>
                        <Input
                          id="feed-cost"
                          type="number"
                          placeholder="15"
                          value={feedCost}
                          onChange={(e) => setFeedCost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feed-notes">Notes (optional)</Label>
                        <Textarea
                          id="feed-notes"
                          placeholder="Any observations..."
                          value={feedNotes}
                          onChange={(e) => setFeedNotes(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddFeedRecord}>Save Feed Record</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {(() => {
                  const individualFeedRecords = sortedHealthRecords.filter(r => r.notes?.includes("[FEED]"))
                  const hasPenData = cattle.penId && costSummary && (costSummary.feedAllocations.length > 0 || costSummary.feedActivities.length > 0)
                  const hasIndividualRecords = individualFeedRecords.length > 0

                  if (!hasPenData && !hasIndividualRecords) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No feed records yet.</p>
                        <p className="text-sm mt-2">Add individual feed records or assign to a pen to track feed allocations.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-6">
                      {/* Individual Feed Records */}
                      {hasIndividualRecords && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Badge variant="outline">Individual Records</Badge>
                          </h3>
                          <div className="space-y-3">
                            {individualFeedRecords.map((record) => (
                              <div key={record.id} className="border border-border rounded-lg p-4 bg-blue-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">{record.description}</h4>
                                      <span className="text-sm text-muted-foreground">{record.date}</span>
                                    </div>
                                  </div>
                                  {record.cost && (
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-foreground">${record.cost.toFixed(2)}</p>
                                    </div>
                                  )}
                                </div>
                                {record.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                                    Notes: {record.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pen-Level Allocations */}
                      {hasPenData && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Badge variant="outline">Pen Allocations</Badge>
                          </h3>
                          <div className="space-y-4">
                    {/* Detailed Feed Allocations (from feedService) */}
                    {costSummary.feedAllocations.map((feedHistory) => (
                      <div key={feedHistory.allocation.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{feedHistory.allocation.penName}</Badge>
                              <span className="text-sm text-muted-foreground">{feedHistory.allocation.date}</span>
                              <Badge className="bg-blue-100 text-blue-800">Detailed</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {feedHistory.allocation.headCount} head • {feedHistory.cattleShare.toFixed(1)}% share for this cattle
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">${feedHistory.cattleCost.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">This cattle's cost</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {feedHistory.allocation.feedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                              <span className="font-medium">{item.feedName}</span>
                              <span className="text-muted-foreground">
                                {(item.quantity / feedHistory.allocation.headCount).toFixed(2)} {item.unit} per head
                              </span>
                            </div>
                          ))}
                        </div>
                        {feedHistory.allocation.notes && (
                          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                            Notes: {feedHistory.allocation.notes}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Simple Feed Activities (from penActivityStore) */}
                    {costSummary.feedActivities.map((feedActivity) => (
                      <div key={feedActivity.activity.id} className="border border-border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{feedActivity.activity.feedType}</h4>
                              <Badge variant="outline">Quick Feed</Badge>
                              <span className="text-sm text-muted-foreground">{feedActivity.activity.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {feedActivity.activity.cattleCount} head in pen
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">${feedActivity.cattleCost.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">This cattle's cost</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                          <span className="text-muted-foreground">Amount per head:</span>
                          <span className="font-medium">
                            {feedActivity.cattleAmount.toFixed(2)} {feedActivity.activity.unit}
                          </span>
                        </div>
                        {feedActivity.activity.notes && (
                          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                            Notes: {feedActivity.activity.notes}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Pen-Level Feed Cost:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${costSummary.feedCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="mt-3 sm:mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medication History
                  </CardTitle>
                  {currentPen && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing pen-level medication activities for {currentPen.name}. Costs are per head.
                    </p>
                  )}
                </div>
                <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Individual Medication Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="medication-date">Date</Label>
                        <Input
                          id="medication-date"
                          type="date"
                          value={medicationDate}
                          onChange={(e) => setMedicationDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medication-name">Medication Name</Label>
                        <Input
                          id="medication-name"
                          placeholder="e.g., Penicillin, Ivermectin"
                          value={medicationName}
                          onChange={(e) => setMedicationName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="medication-dosage">Dosage</Label>
                          <Input
                            id="medication-dosage"
                            type="number"
                            placeholder="5"
                            value={medicationDosage}
                            onChange={(e) => setMedicationDosage(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="medication-unit">Unit</Label>
                          <Select value={medicationUnit} onValueChange={setMedicationUnit}>
                            <SelectTrigger id="medication-unit">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="cc">cc</SelectItem>
                              <SelectItem value="mg">mg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="tablets">tablets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medication-purpose">Purpose</Label>
                        <Select value={medicationPurpose} onValueChange={setMedicationPurpose}>
                          <SelectTrigger id="medication-purpose">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Treatment">Treatment</SelectItem>
                            <SelectItem value="Prevention">Prevention</SelectItem>
                            <SelectItem value="Vaccination">Vaccination</SelectItem>
                            <SelectItem value="Parasite Control">Parasite Control</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medication-cost">Cost ($) (optional)</Label>
                        <Input
                          id="medication-cost"
                          type="number"
                          placeholder="25"
                          value={medicationCost}
                          onChange={(e) => setMedicationCost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medication-withdrawal">Withdrawal Period (days) (optional)</Label>
                        <Input
                          id="medication-withdrawal"
                          type="number"
                          placeholder="14"
                          value={medicationWithdrawal}
                          onChange={(e) => setMedicationWithdrawal(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medication-notes">Notes (optional)</Label>
                        <Textarea
                          id="medication-notes"
                          placeholder="Any observations..."
                          value={medicationNotes}
                          onChange={(e) => setMedicationNotes(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddMedicationRecord}>Save Medication Record</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {(() => {
                  const individualMedicationRecords = sortedHealthRecords.filter(r => r.notes?.includes("[MEDICATION]"))
                  const hasPenData = cattle.penId && costSummary && costSummary.medications.length > 0
                  const hasIndividualRecords = individualMedicationRecords.length > 0

                  if (!hasPenData && !hasIndividualRecords) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No medication records yet.</p>
                        <p className="text-sm mt-2">Add individual medication records or assign to a pen to track medications.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-6">
                      {/* Individual Medication Records */}
                      {hasIndividualRecords && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Badge variant="outline">Individual Records</Badge>
                          </h3>
                          <div className="space-y-3">
                            {individualMedicationRecords.map((record) => (
                              <div key={record.id} className="border border-border rounded-lg p-4 bg-purple-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">{record.description}</h4>
                                      <span className="text-sm text-muted-foreground">{record.date}</span>
                                    </div>
                                  </div>
                                  {record.cost && (
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-foreground">${record.cost.toFixed(2)}</p>
                                    </div>
                                  )}
                                </div>
                                {record.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                                    {record.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pen-Level Medications */}
                      {hasPenData && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Badge variant="outline">Pen Medications</Badge>
                          </h3>
                          <div className="space-y-4">
                    {costSummary.medications.map((medHistory) => (
                      <div key={medHistory.activity.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{medHistory.activity.medicationName}</h4>
                              <Badge variant="outline">{medHistory.activity.purpose}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{medHistory.activity.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">${medHistory.cattleCost.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Cost per head</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div className="bg-muted/50 p-3 rounded">
                            <p className="text-muted-foreground text-xs mb-1">Dosage (This Cattle)</p>
                            <p className="font-semibold">{medHistory.cattleDosage} {medHistory.activity.unit}</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded">
                            <p className="text-muted-foreground text-xs mb-1">Total Treated</p>
                            <p className="font-semibold">{medHistory.activity.cattleCount} head</p>
                          </div>
                          {medHistory.activity.withdrawalPeriod && (
                            <div className="bg-amber-50 p-3 rounded col-span-2">
                              <p className="text-muted-foreground text-xs mb-1">Withdrawal Period</p>
                              <p className="font-semibold text-amber-800">{medHistory.activity.withdrawalPeriod} days</p>
                            </div>
                          )}
                        </div>
                        {medHistory.activity.notes && (
                          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                            Notes: {medHistory.activity.notes}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Pen-Level Medication Cost:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${costSummary.medicationCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-3 sm:mt-4">
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
                        <Input
                          id="health-date"
                          type="date"
                          value={healthDate}
                          onChange={(e) => setHealthDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-type">Type</Label>
                        <Select value={healthType} onValueChange={setHealthType}>
                          <SelectTrigger id="health-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vaccination">Vaccination</SelectItem>
                            <SelectItem value="Treatment">Treatment</SelectItem>
                            <SelectItem value="Checkup">Checkup</SelectItem>
                            <SelectItem value="Surgery">Surgery</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-description">Description</Label>
                        <Textarea
                          id="health-description"
                          placeholder="Details of the visit..."
                          value={healthDescription}
                          onChange={(e) => setHealthDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-vet">Veterinarian (optional)</Label>
                        <Input
                          id="health-vet"
                          placeholder="Dr. Smith"
                          value={healthVet}
                          onChange={(e) => setHealthVet(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-cost">Cost ($) (optional)</Label>
                        <Input
                          id="health-cost"
                          type="number"
                          placeholder="75"
                          value={healthCost}
                          onChange={(e) => setHealthCost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-notes">Notes (optional)</Label>
                        <Textarea
                          id="health-notes"
                          placeholder="Any additional notes..."
                          value={healthNotes}
                          onChange={(e) => setHealthNotes(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="health-next">Next Visit (optional)</Label>
                        <Input
                          id="health-next"
                          type="date"
                          value={healthNextVisit}
                          onChange={(e) => setHealthNextVisit(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddHealthRecord}>Save Health Record</Button>
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

          <TabsContent value="financial" className="mt-3 sm:mt-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Price & Value Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
                        <p className="text-2xl font-bold text-foreground">${cattle.purchasePrice || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          ${cattle.purchasePrice && cattle.purchaseWeight ? (cattle.purchasePrice / cattle.purchaseWeight).toFixed(2) : "N/A"}/lb
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
                          +${((cattle.purchasePrice || 0) > 0 ? (currentValue - (cattle.purchasePrice || 0)).toFixed(0) : "0")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((cattle.purchasePrice || 0) > 0 ? (((currentValue - (cattle.purchasePrice || 0)) / (cattle.purchasePrice || 1)) * 100).toFixed(1) : "0")}%
                          increase
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Real-time cost tracking based on actual feed and medication allocations
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Purchase Cost:</span>
                      <span className="font-medium text-foreground">${(cattle.purchasePrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Wheat className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Feed Costs:</span>
                      </div>
                      <span className="font-medium text-foreground">
                        ${costSummary?.feedCost.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Medication Costs:</span>
                      </div>
                      <span className="font-medium text-foreground">
                        ${costSummary?.medicationCost.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Veterinary Costs:</span>
                      </div>
                      <span className="font-medium text-foreground">
                        ${costSummary?.healthRecordCost.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-muted/50 px-2 rounded">
                      <span className="font-semibold text-foreground">Total Variable Costs:</span>
                      <span className="font-bold text-foreground">
                        ${costSummary?.totalVariableCost.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-blue-50 px-2 rounded">
                      <span className="font-semibold text-foreground">Total Investment:</span>
                      <span className="font-bold text-foreground">
                        ${((cattle.purchasePrice || 0) + (costSummary?.totalVariableCost || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-green-50 px-2 rounded">
                      <span className="font-semibold text-foreground">Current Profit/Loss:</span>
                      <span className={`font-bold ${
                        currentValue - ((cattle.purchasePrice || 0) + (costSummary?.totalVariableCost || 0)) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        ${(currentValue - ((cattle.purchasePrice || 0) + (costSummary?.totalVariableCost || 0))).toFixed(2)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cattle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete cattle #{cattle?.tagNumber}? This action cannot be undone and will remove all associated records including weight history, health records, and feed allocations.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCattle}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Cattle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disease Tracking Dialog */}
      <Dialog open={isDiseaseDialogOpen} onOpenChange={setIsDiseaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Update Health Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disease-status">Health Status</Label>
              <Select value={diseaseStatus} onValueChange={setDiseaseStatus}>
                <SelectTrigger id="disease-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Sick">Sick / Diseased</SelectItem>
                  <SelectItem value="Treatment">Under Treatment</SelectItem>
                  <SelectItem value="Quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disease-notes">Notes</Label>
              <Textarea
                id="disease-notes"
                placeholder="Describe symptoms, diagnosis, treatment plan..."
                value={diseaseNotes}
                onChange={(e) => setDiseaseNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDiseaseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAsDiseased}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mortality Tracking Dialog */}
      <MortalityTrackingDialog
        cattleId={cattle.id}
        penId={cattle.penId}
        open={isMortalityDialogOpen}
        onOpenChange={(open) => {
          setIsMortalityDialogOpen(open)
          if (!open) {
            // Refresh data after mortality is recorded
            setRefreshKey(prev => prev + 1)
          }
        }}
      />
    </div>
  )
}
