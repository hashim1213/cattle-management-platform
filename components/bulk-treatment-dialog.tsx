"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Cattle } from "@/lib/data-store"
import {
  TreatmentProtocol,
  calculateWeightBasedDosage,
  calculateTotalDrugRequirements,
  estimateProtocolCost
} from "@/lib/health/treatment-protocols"
import { protocolService } from "@/lib/health/protocol-service"
import { inventoryService } from "@/lib/inventory/inventory-service"
import { healthService } from "@/lib/health/health-service"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Syringe,
  Package,
  DollarSign,
  Calendar,
  AlertCircle
} from "lucide-react"

interface BulkTreatmentDialogProps {
  open: boolean
  onClose: () => void
  selectedCattle: Cattle[]
  onComplete?: () => void
}

type Stage = "setup" | "confirm" | "processing" | "complete"

interface ProcessingStats {
  successful: number
  failed: number
  totalCost: number
  errors: string[]
}

export function BulkTreatmentDialog({
  open,
  onClose,
  selectedCattle,
  onComplete
}: BulkTreatmentDialogProps) {
  const [stage, setStage] = useState<Stage>("setup")
  const [selectedProtocol, setSelectedProtocol] = useState<TreatmentProtocol | null>(null)
  const [notes, setNotes] = useState("")
  const [inventoryCheck, setInventoryCheck] = useState<Record<string, { available: boolean; message: string }>>({})
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    successful: 0,
    failed: 0,
    totalCost: 0,
    errors: []
  })

  const protocols = protocolService.getAllProtocols()

  // Calculate summary statistics
  const totalAnimals = selectedCattle.length
  const avgWeight = selectedCattle.reduce((sum, c) => sum + c.weight, 0) / totalAnimals
  const totalWeight = selectedCattle.reduce((sum, c) => sum + c.weight, 0)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStage("setup")
      setSelectedProtocol(null)
      setNotes("")
      setInventoryCheck({})
      setProcessingProgress(0)
      setProcessingStats({ successful: 0, failed: 0, totalCost: 0, errors: [] })
    }
  }, [open])

  // Check inventory availability when protocol is selected
  useEffect(() => {
    if (selectedProtocol && selectedCattle.length > 0) {
      checkInventoryAvailability()
    }
  }, [selectedProtocol, selectedCattle])

  const checkInventoryAvailability = async () => {
    if (!selectedProtocol) return

    const requirements = calculateTotalDrugRequirements(
      selectedProtocol,
      selectedCattle.map(c => ({ weight: c.weight }))
    )

    const checks: Record<string, { available: boolean; message: string }> = {}

    for (const [key, req] of Object.entries(requirements)) {
      const availability = await inventoryService.checkAvailability(req.drugId, req.totalRequired)

      checks[key] = {
        available: availability.available,
        message: availability.available
          ? `✓ ${req.drugName}: Need ${req.totalRequired.toFixed(1)}${req.unit}, have ${availability.currentQuantity.toFixed(1)}${req.unit}`
          : `✗ ${req.drugName}: Need ${req.totalRequired.toFixed(1)}${req.unit}, have ${availability.currentQuantity.toFixed(1)}${req.unit} (short ${availability.shortfall.toFixed(1)}${req.unit})`
      }
    }

    setInventoryCheck(checks)
  }

  const allInventoryAvailable = Object.values(inventoryCheck).every(check => check.available)
  const estimatedCost = selectedProtocol ? estimateProtocolCost(selectedProtocol, totalAnimals) : 0

  const handleContinueToConfirm = () => {
    if (!selectedProtocol) return
    if (!allInventoryAvailable) return
    setStage("confirm")
  }

  const handleConfirmAndExecute = async () => {
    if (!selectedProtocol) return

    setStage("processing")
    setProcessingProgress(0)

    const stats: ProcessingStats = {
      successful: 0,
      failed: 0,
      totalCost: 0,
      errors: []
    }

    // Process in batches of 10 for smooth UX
    const batchSize = 10
    const totalBatches = Math.ceil(selectedCattle.length / batchSize)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize
      const batchEnd = Math.min(batchStart + batchSize, selectedCattle.length)
      const batch = selectedCattle.slice(batchStart, batchEnd)

      for (const animal of batch) {
        try {
          // Process each drug in the protocol
          for (const drug of selectedProtocol.drugs) {
            const dosage = calculateWeightBasedDosage(drug, animal.weight)

            await healthService.recordTreatment({
              cattleId: animal.id,
              cattleTagNumber: animal.tagNumber,
              drugName: drug.drugName,
              drugInventoryId: drug.drugInventoryId,
              dosageAmount: dosage,
              dosageUnit: drug.dosageUnit,
              administrationRoute: drug.administrationRoute,
              withdrawalPeriod: drug.withdrawalPeriod,
              cattleWeight: animal.weight,
              notes: notes || `Bulk treatment: ${selectedProtocol.name}`,
              recordedBy: "current-user",
              eventType: drug.drugName.toLowerCase().includes("vaccine") ? "vaccination" : "antibiotic-treatment"
            })
          }

          stats.successful++
          stats.totalCost += selectedProtocol.estimatedCostPerHead
        } catch (error) {
          stats.failed++
          stats.errors.push(`${animal.tagNumber}: ${(error as Error).message}`)
        }
      }

      // Update progress after each batch
      const processedCount = Math.min(batchEnd, selectedCattle.length)
      setProcessingProgress((processedCount / selectedCattle.length) * 100)

      // Update stats in real-time
      setProcessingStats({ ...stats })

      // Small delay between batches for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Move to complete stage
    setProcessingStats(stats)
    setStage("complete")
  }

  const handleClose = () => {
    onClose()
    if (stage === "complete" && onComplete) {
      onComplete()
    }
  }

  const maxWithdrawalPeriod = selectedProtocol
    ? Math.max(...selectedProtocol.drugs.map(d => d.withdrawalPeriod))
    : 0

  const withdrawalDate = new Date()
  withdrawalDate.setDate(withdrawalDate.getDate() + maxWithdrawalPeriod)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Syringe className="h-6 w-6 text-primary" />
            Bulk Treatment - {selectedCattle.length} Animals
          </DialogTitle>
        </DialogHeader>

        {/* STAGE 1: SETUP */}
        {stage === "setup" && (
          <div className="space-y-6 py-4">
            {/* Animals Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Animals</div>
                <div className="text-2xl font-bold">{totalAnimals}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Avg Weight</div>
                <div className="text-2xl font-bold">{avgWeight.toFixed(0)} lbs</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Weight</div>
                <div className="text-2xl font-bold">{totalWeight.toFixed(0)} lbs</div>
              </div>
            </div>

            {/* Protocol Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Treatment Protocol *</label>
              <Select
                value={selectedProtocol?.id || ""}
                onValueChange={(value) => {
                  const protocol = protocols.find(p => p.id === value)
                  setSelectedProtocol(protocol || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a protocol..." />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map(protocol => (
                    <SelectItem key={protocol.id} value={protocol.id}>
                      <div className="flex items-center gap-2">
                        <span>{protocol.name}</span>
                        <Badge variant="outline">${protocol.estimatedCostPerHead}/head</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Protocol Details */}
            {selectedProtocol && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProtocol.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProtocol.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Drugs in Protocol:</h4>
                  {selectedProtocol.drugs.map((drug, idx) => (
                    <div key={idx} className="text-sm bg-background p-3 rounded border">
                      <div className="font-medium">{drug.drugName}</div>
                      <div className="text-muted-foreground">
                        {drug.dosageAmount}{drug.dosageUnit} {drug.dosageType === "weight-based" ? "(weight-based)" : "(fixed)"} · {drug.administrationRoute} · {drug.withdrawalPeriod} day withdrawal
                      </div>
                      {drug.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{drug.notes}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inventory Check */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Inventory Availability Check
                  </h4>
                  {Object.entries(inventoryCheck).map(([key, check]) => (
                    <div key={key} className="text-sm flex items-start gap-2">
                      {check.available ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <span className={check.available ? "text-muted-foreground" : "text-destructive"}>
                        {check.message}
                      </span>
                    </div>
                  ))}
                </div>

                {!allInventoryAvailable && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Inventory</AlertTitle>
                    <AlertDescription>
                      You need to restock the items marked above before proceeding. Go to Inventory page to add more stock.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cost Estimate */}
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-5 w-5" />
                    Estimated Total Cost
                  </div>
                  <div className="text-xl font-bold">
                    ${estimatedCost.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (${selectedProtocol.estimatedCostPerHead.toFixed(2)}/head)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any additional notes about this treatment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleContinueToConfirm}
                disabled={!selectedProtocol || !allInventoryAvailable}
              >
                Continue to Confirmation
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 2: CONFIRM */}
        {stage === "confirm" && selectedProtocol && (
          <div className="space-y-6 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Review Before Executing</AlertTitle>
              <AlertDescription>
                Please review the details below carefully. This operation cannot be undone.
              </AlertDescription>
            </Alert>

            {/* What Will Happen */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What Will Happen:</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Syringe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Create {totalAnimals} Health Records</div>
                    <div className="text-sm text-muted-foreground">
                      One health record per animal with treatment details
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Deduct Inventory</div>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(calculateTotalDrugRequirements(selectedProtocol, selectedCattle.map(c => ({ weight: c.weight })))).map(([_, req]) => (
                        <div key={req.drugId}>
                          - {req.drugName}: {req.totalRequired.toFixed(1)}{req.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Total Cost: ${estimatedCost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      ${selectedProtocol.estimatedCostPerHead.toFixed(2)} per head × {totalAnimals} animals
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Withdrawal Period: {maxWithdrawalPeriod} days</div>
                    <div className="text-sm text-muted-foreground">
                      Safe to sell after: {withdrawalDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cannot Be Undone</AlertTitle>
              <AlertDescription>
                Once executed, health records will be created and inventory will be deducted. This action cannot be reversed.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStage("setup")}>
                Back to Setup
              </Button>
              <Button onClick={handleConfirmAndExecute} variant="default">
                Confirm &amp; Execute Treatment
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 3: PROCESSING */}
        {stage === "processing" && (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Processing Treatments...</h3>
              <p className="text-muted-foreground">
                {processingStats.successful} of {totalAnimals} animals treated
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={processingProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {processingProgress.toFixed(0)}% Complete
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Please wait... This may take a few moments for large groups.
            </p>
          </div>
        )}

        {/* STAGE 4: COMPLETE */}
        {stage === "complete" && selectedProtocol && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">Treatment Complete!</h3>
              <p className="text-muted-foreground">
                Bulk treatment has been successfully applied to your cattle.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-900 dark:text-green-100">Successful</div>
                <div className="text-3xl font-bold text-green-600">{processingStats.successful}</div>
              </div>

              {processingStats.failed > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-900 dark:text-red-100">Failed</div>
                  <div className="text-3xl font-bold text-red-600">{processingStats.failed}</div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-900 dark:text-blue-100">Total Cost</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${processingStats.totalCost.toFixed(2)}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-sm text-purple-900 dark:text-purple-100">Cost per Head</div>
                <div className="text-2xl font-bold text-purple-600">
                  ${(processingStats.totalCost / processingStats.successful).toFixed(2)}
                </div>
              </div>
            </div>

            {/* What Was Done */}
            <div className="space-y-2">
              <h4 className="font-medium">What Was Completed:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{processingStats.successful} health records created</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Inventory automatically deducted</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Transaction logs created</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Withdrawal dates calculated ({maxWithdrawalPeriod} days)</span>
                </div>
              </div>
            </div>

            {/* Errors (if any) */}
            {processingStats.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Some Treatments Failed</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {processingStats.errors.map((error, idx) => (
                      <div key={idx} className="text-xs font-mono">
                        {error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={handleClose} size="lg">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
