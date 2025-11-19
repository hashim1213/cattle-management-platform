"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { firebaseDataStore as dataStore, type Cattle } from "@/lib/data-store-firebase"
import { useTreatmentStore } from "@/hooks/use-treatment-store"
import { Scan, Search, Syringe, Activity, AlertCircle, Calendar, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

interface IndividualTreatmentLookupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IndividualTreatmentLookup({ open, onOpenChange }: IndividualTreatmentLookupProps) {
  const router = useRouter()
  const { getCattleTreatments, getActiveWithdrawals } = useTreatmentStore()
  const [searchMode, setSearchMode] = useState<"rfid" | "tag" | "name">("rfid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCattle, setSelectedCattle] = useState<Cattle | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Simulated RFID scan - in production this would connect to actual RFID reader
  const handleRFIDScan = () => {
    setIsScanning(true)
    // Simulate RFID scan delay
    setTimeout(() => {
      // In production, this would get data from the RFID reader
      // For demo, we'll just search for any cattle with RFID
      const cattle = dataStore.getCattle().find((c) => c.rfidTag && c.status === "Active")
      if (cattle) {
        setSelectedCattle(cattle)
        setSearchQuery(cattle.rfidTag || "")
      }
      setIsScanning(false)
    }, 1500)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    const cattle = dataStore.getCattle().find((c) => {
      if (c.status !== "Active") return false

      switch (searchMode) {
        case "rfid":
          return c.rfidTag?.toLowerCase() === searchQuery.toLowerCase()
        case "tag":
          return c.tagNumber.toLowerCase() === searchQuery.toLowerCase()
        case "name":
          return c.name?.toLowerCase().includes(searchQuery.toLowerCase())
        default:
          return false
      }
    })

    setSelectedCattle(cattle || null)
  }

  const treatments = selectedCattle ? getCattleTreatments(selectedCattle.id) : []
  const healthRecords = selectedCattle ? dataStore.getHealthRecords(selectedCattle.id) : []
  const weightRecords = selectedCattle ? dataStore.getWeightRecords(selectedCattle.id) : []

  const activeWithdrawals = getActiveWithdrawals().filter((t) => t.cattleId === selectedCattle?.id)

  const totalTreatmentCost = treatments.reduce((sum, t) => sum + t.cost, 0)
  const totalHealthCost = healthRecords.reduce((sum, h) => sum + (h.cost || 0), 0)

  const handleViewDetails = () => {
    if (selectedCattle) {
      onOpenChange(false)
      router.push(`/cattle/${selectedCattle.id}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Individual Treatment Lookup
          </DialogTitle>
          <DialogDescription>
            Quickly pull up an animal's health record via RFID scan, tag number, or name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Interface */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Find Cattle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search Mode Selection */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={searchMode === "rfid" ? "default" : "outline"}
                  onClick={() => setSearchMode("rfid")}
                  className="flex-1"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  RFID
                </Button>
                <Button
                  size="sm"
                  variant={searchMode === "tag" ? "default" : "outline"}
                  onClick={() => setSearchMode("tag")}
                  className="flex-1"
                >
                  Tag #
                </Button>
                <Button
                  size="sm"
                  variant={searchMode === "name" ? "default" : "outline"}
                  onClick={() => setSearchMode("name")}
                  className="flex-1"
                >
                  Name
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                {searchMode === "rfid" && (
                  <Button
                    onClick={handleRFIDScan}
                    disabled={isScanning}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Scan className={`h-4 w-4 ${isScanning ? "animate-pulse" : ""}`} />
                    {isScanning ? "Scanning..." : "Scan RFID"}
                  </Button>
                )}
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder={
                      searchMode === "rfid"
                        ? "Enter RFID tag or scan..."
                        : searchMode === "tag"
                          ? "Enter tag number..."
                          : "Enter cattle name..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {selectedCattle ? (
            <div className="space-y-4">
              {/* Cattle Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Tag #{selectedCattle.tagNumber}
                        {selectedCattle.name && (
                          <span className="text-muted-foreground">- {selectedCattle.name}</span>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedCattle.breed}</Badge>
                        <Badge variant="outline">{selectedCattle.sex}</Badge>
                        <Badge variant="secondary">{selectedCattle.stage}</Badge>
                        <Badge
                          variant={selectedCattle.healthStatus === "Healthy" ? "default" : "destructive"}
                        >
                          {selectedCattle.healthStatus}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={handleViewDetails} variant="outline" size="sm">
                      View Full Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Weight</p>
                      <p className="text-lg font-semibold">{selectedCattle.weight} lbs</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RFID Tag</p>
                      <p className="text-lg font-semibold">{selectedCattle.rfidTag || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Vet Visit</p>
                      <p className="text-lg font-semibold">
                        {selectedCattle.lastVetVisit
                          ? new Date(selectedCattle.lastVetVisit).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Withdrawals Warning */}
              {activeWithdrawals.length > 0 && (
                <Card className="border-orange-500 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900">Active Withdrawal Periods</h4>
                        <div className="mt-2 space-y-1">
                          {activeWithdrawals.map((t) => (
                            <div key={t.id} className="text-sm text-orange-800">
                              <span className="font-medium">{t.productName}</span> - Withdrawal until{" "}
                              {new Date(t.withdrawalDate!).toLocaleDateString()}
                              <span className="ml-2 text-orange-600">
                                ({Math.ceil(
                                  (new Date(t.withdrawalDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                )}{" "}
                                days)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Treatments</p>
                        <p className="text-2xl font-bold">{treatments.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Treatment Costs</p>
                        <p className="text-2xl font-bold">${(totalTreatmentCost + totalHealthCost).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Weight Records</p>
                        <p className="text-2xl font-bold">{weightRecords.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Treatment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Treatments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {treatments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No treatments recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {treatments.slice(0, 10).map((treatment) => (
                          <div key={treatment.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{treatment.productName}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {treatment.treatmentType.replace("-", " ")}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {new Date(treatment.date).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Dosage:</span>{" "}
                                <span className="font-medium">
                                  {treatment.dosage} {treatment.dosageUnit}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Method:</span>{" "}
                                <span className="font-medium capitalize">{treatment.applicationMethod}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">By:</span>{" "}
                                <span className="font-medium">{treatment.administeredBy}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost:</span>{" "}
                                <span className="font-medium">${treatment.cost.toFixed(2)}</span>
                              </div>
                            </div>
                            {treatment.withdrawalPeriodDays && treatment.withdrawalPeriodDays > 0 && (
                              <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Withdrawal: {treatment.withdrawalPeriodDays} days
                              </div>
                            )}
                            {treatment.reason && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Reason: {treatment.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Health Records */}
              {healthRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {healthRecords.slice(0, 5).map((record) => (
                          <div key={record.id} className="border rounded p-2 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge variant="outline" className="mb-1">
                                  {record.type}
                                </Badge>
                                <p className="font-medium">{record.description}</p>
                                {record.veterinarian && (
                                  <p className="text-muted-foreground">By: {record.veterinarian}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground">
                                  {new Date(record.date).toLocaleDateString()}
                                </p>
                                {record.cost && <p className="font-medium">${record.cost.toFixed(2)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : searchQuery && !selectedCattle ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No cattle found</h3>
                <p className="text-sm text-muted-foreground">
                  No active cattle found with {searchMode === "rfid" ? "RFID" : searchMode === "tag" ? "tag number" : "name"}: "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Search for cattle</h3>
                <p className="text-sm text-muted-foreground">
                  Use RFID scan, tag number, or name to pull up health records
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
