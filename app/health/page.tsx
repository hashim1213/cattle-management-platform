"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { Heart, AlertCircle, TrendingDown, Activity, Syringe, FileText, Calendar, ArrowUpRight, Search, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { BulkTreatmentDialog } from "@/components/bulk-treatment-dialog"
import { AddTreatmentDialog } from "@/components/add-treatment-dialog"
import { CreateProtocolDialog } from "@/components/create-protocol-dialog"

export default function HealthOverviewPage() {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCattle, setSelectedCattle] = useState<Cattle[]>([])
  const [bulkTreatmentOpen, setBulkTreatmentOpen] = useState(false)
  const [addTreatmentOpen, setAddTreatmentOpen] = useState(false)
  const [createProtocolOpen, setCreateProtocolOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading health page data...")
        const cattleData = await firebaseDataStore.getCattle()
        console.log(`Loaded ${cattleData.length} cattle`)
        setCattle(cattleData)

        const healthData = await firebaseDataStore.getAllHealthRecords()
        console.log(`Loaded ${healthData.length} health records`)
        setHealthRecords(healthData)
      } catch (error) {
        console.error("Failed to load health data:", error)
        // Set empty data on error to avoid infinite loading
        setCattle([])
        setHealthRecords([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate health statistics
  const stats = useMemo(() => {
    // Ensure cattle is an array
    const cattleArray = Array.isArray(cattle) ? cattle : []
    const healthRecordsArray = Array.isArray(healthRecords) ? healthRecords : []

    const activeCattle = cattleArray.filter(c => c.status === "Active")
    const totalCattle = activeCattle.length

    // Mortality statistics
    const deceasedCattle = cattleArray.filter(c => c.status === "Deceased")
    const soldCattle = cattleArray.filter(c => c.status === "Sold")
    const culledCattle = cattleArray.filter(c => c.status === "Culled")
    const mortalityRate = totalCattle > 0 ? (deceasedCattle.length / (totalCattle + deceasedCattle.length)) * 100 : 0

    // Health status breakdown
    const healthyCattle = activeCattle.filter(c => c && c.healthStatus === "Healthy").length
    const sickCattle = activeCattle.filter(c => c && c.healthStatus === "Sick").length
    const treatmentCattle = activeCattle.filter(c => c && c.healthStatus === "Treatment").length
    const quarantineCattle = activeCattle.filter(c => c && c.healthStatus === "Quarantine").length

    // Cattle with health issues (sick + treatment + quarantine)
    const cattleWithIssues = sickCattle + treatmentCattle + quarantineCattle

    // Recent health records (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentHealthRecords = healthRecordsArray.filter(r =>
      new Date(r.date) >= sevenDaysAgo
    ).length

    // Vet visits tracking
    const cattleWithRecentVetVisit = activeCattle.filter(c => {
      if (!c.lastVetVisit) return false
      const visitDate = new Date(c.lastVetVisit)
      return visitDate >= sevenDaysAgo
    }).length

    // Health score calculation
    const healthyPercentage = totalCattle > 0 ? (healthyCattle / totalCattle) : 1
    const healthScore = Math.round(
      (1 - mortalityRate / 100) * 40 + // 40% weight on low mortality
      healthyPercentage * 40 + // 40% weight on healthy cattle
      (1 - (cattleWithIssues / totalCattle)) * 20 // 20% weight on low issues
    )

    return {
      totalCattle,
      deceasedCattle: deceasedCattle.length,
      soldCattle: soldCattle.length,
      culledCattle: culledCattle.length,
      mortalityRate,
      healthyCattle,
      sickCattle,
      treatmentCattle,
      quarantineCattle,
      cattleWithIssues,
      recentHealthRecords,
      cattleWithRecentVetVisit,
      healthScore
    }
  }, [cattle, healthRecords])

  // Group deceased cattle by notes
  const mortalityCauses = useMemo(() => {
    // Ensure cattle is an array
    const cattleArray = Array.isArray(cattle) ? cattle : []
    const causes: Record<string, number> = {}

    cattleArray.filter(c => c.status === "Deceased").forEach(c => {
      const cause = c.notes || "Unknown"
      causes[cause] = (causes[cause] || 0) + 1
    })

    return Object.entries(causes).sort((a, b) => b[1] - a[1])
  }, [cattle])

  // Recent health events from health records
  const recentEvents = useMemo(() => {
    // Ensure arrays exist
    const healthRecordsArray = Array.isArray(healthRecords) ? healthRecords : []
    const cattleArray = Array.isArray(cattle) ? cattle : []

    return healthRecordsArray
      .slice(0, 20)
      .map(record => {
        const animal = cattleArray.find(c => c && c.id === record.cattleId)
        if (!animal || !animal.tagNumber) return null

        return {
          id: record.id,
          type: "health_check",
          cattleId: record.cattleId,
          tagNumber: animal.tagNumber || "Unknown",
          date: record.date,
          description: record.diagnosis || "Health check performed",
          severity: record.severity || ("low" as "low" | "medium" | "high")
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15)
  }, [healthRecords, cattle])

  // Filtered cattle for bulk treatment
  const filteredCattle = useMemo(() => {
    // Ensure cattle is an array
    const cattleArray = Array.isArray(cattle) ? cattle : []
    const activeCattle = cattleArray.filter(c => c && c.status === "Active")
    if (!searchQuery) return activeCattle

    const query = searchQuery.toLowerCase()
    return activeCattle.filter(c => {
      // Defensive checks for null/undefined fields
      if (!c) return false
      const tagNumber = (c.tagNumber || "").toLowerCase()
      const name = (c.name || "").toLowerCase()
      const breed = (c.breed || "").toLowerCase()

      return tagNumber.includes(query) || name.includes(query) || breed.includes(query)
    })
  }, [cattle, searchQuery])

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedCattle.length === filteredCattle.length) {
      setSelectedCattle([])
    } else {
      setSelectedCattle(filteredCattle)
    }
  }

  const handleSelectCattle = (animal: Cattle) => {
    setSelectedCattle(prev => {
      const isSelected = prev.some(c => c.id === animal.id)
      if (isSelected) {
        return prev.filter(c => c.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  const handleBulkTreatment = () => {
    if (selectedCattle.length === 0) return
    setBulkTreatmentOpen(true)
  }

  const handleTreatmentComplete = () => {
    setSelectedCattle([])
    // The health records will be automatically updated by the service
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="default">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Health Overview</h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateProtocolOpen(true)}
                className="hidden md:flex touch-manipulation min-h-[44px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Protocol
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddTreatmentOpen(true)}
                className="hidden sm:flex touch-manipulation min-h-[44px]"
              >
                <Syringe className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                size="sm"
                onClick={handleBulkTreatment}
                disabled={selectedCattle.length === 0}
                className="touch-manipulation min-h-[44px] px-3"
              >
                <Syringe className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bulk ({selectedCattle.length})</span>
                <span className="sm:hidden">{selectedCattle.length}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-safe">
        {/* Health Score & Key Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="sm:col-span-2 lg:col-span-1 touch-manipulation">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Overall Health Score</p>
                  <p className={`text-3xl sm:text-4xl font-bold mt-1 sm:mt-2 ${getHealthScoreColor(stats.healthScore)}`}>
                    {stats.healthScore}/100
                  </p>
                </div>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${stats.healthScore >= 80 ? "bg-green-100" : stats.healthScore >= 60 ? "bg-yellow-100" : "bg-red-100"} flex items-center justify-center flex-shrink-0`}>
                  <Heart className={`h-6 w-6 sm:h-8 sm:w-8 ${stats.healthScore >= 80 ? "text-green-600" : stats.healthScore >= 60 ? "text-yellow-600" : "text-red-600"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="touch-manipulation">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Mortality Rate</p>
                  <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.mortalityRate.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                    {stats.deceasedCattle} total deaths
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="touch-manipulation">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Health Issues</p>
                  <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.cattleWithIssues}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                    {((stats.cattleWithIssues / stats.totalCattle) * 100).toFixed(1)}% of herd
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="touch-manipulation">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Healthy Cattle</p>
                  <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.healthyCattle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                    {((stats.healthyCattle / stats.totalCattle) * 100).toFixed(1)}% of herd
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mortality Analysis & Health Trends */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mortality Breakdown</CardTitle>
              <CardDescription>Deceased cattle by cause of death</CardDescription>
            </CardHeader>
            <CardContent>
              {mortalityCauses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No mortality records</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mortalityCauses.map(([cause, count]) => (
                    <div key={cause} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{cause}</p>
                        <p className="text-sm text-muted-foreground">
                          {((count / stats.deceasedCattle) * 100).toFixed(1)}% of total deaths
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">cases</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Population Status</CardTitle>
              <CardDescription>Current cattle distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Active Cattle</p>
                      <p className="text-sm text-green-700">Healthy and in production</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats.totalCattle}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Sold Cattle</p>
                      <p className="text-sm text-blue-700">Successfully marketed</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats.soldCattle}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Deceased Cattle</p>
                      <p className="text-sm text-red-700">Total mortality count</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{stats.deceasedCattle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cattle Selection for Bulk Treatment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Cattle for Treatment</CardTitle>
                <CardDescription>Choose cattle to apply bulk treatments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedCattle.length === filteredCattle.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tag number, name, or breed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Cattle List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredCattle.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cattle found</p>
                </div>
              ) : (
                filteredCattle.map((animal) => {
                  const isSelected = selectedCattle.some(c => c.id === animal.id)
                  return (
                    <div
                      key={animal.id}
                      className={`flex items-start gap-2 sm:gap-3 p-3 border rounded-lg cursor-pointer transition-colors touch-manipulation ${
                        isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent/50 active:bg-accent"
                      }`}
                      onClick={() => handleSelectCattle(animal)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectCattle(animal)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-base truncate">{animal.tagNumber}</p>
                            <p className="text-sm text-muted-foreground truncate">{animal.breed}</p>
                          </div>
                          <Badge variant={animal.healthStatus === "Healthy" ? "outline" : "destructive"} className="flex-shrink-0">
                            {animal.healthStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{animal.weight} lbs</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Health Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Events</CardTitle>
            <CardDescription>Latest health checks, treatments, and interventions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent health events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">Tag #{event.tagNumber}</p>
                          {getSeverityBadge(event.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      Health Check
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bulk Treatment Dialog */}
      <BulkTreatmentDialog
        open={bulkTreatmentOpen}
        onClose={() => setBulkTreatmentOpen(false)}
        selectedCattle={selectedCattle}
        onComplete={handleTreatmentComplete}
      />

      {/* Add Treatment Dialog */}
      <AddTreatmentDialog
        open={addTreatmentOpen}
        onOpenChange={setAddTreatmentOpen}
        preSelectedCattleIds={selectedCattle.map(c => c.id)}
        onSuccess={handleTreatmentComplete}
      />

      {/* Create Protocol Dialog */}
      <CreateProtocolDialog
        open={createProtocolOpen}
        onOpenChange={setCreateProtocolOpen}
      />
    </div>
  )
}
