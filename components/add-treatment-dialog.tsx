"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { healthService } from "@/lib/health/health-service"
import { inventoryService } from "@/lib/inventory/inventory-service"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { isDrugCategory } from "@/lib/inventory/inventory-types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface AddTreatmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preSelectedCattleIds?: string[]
  onSuccess?: () => void
}

export function AddTreatmentDialog({
  open,
  onOpenChange,
  preSelectedCattleIds = [],
  onSuccess,
}: AddTreatmentDialogProps) {
  const { toast } = useToast()

  // Form state
  const [selectedCattleIds, setSelectedCattleIds] = useState<string[]>(preSelectedCattleIds)
  const [selectedDrugId, setSelectedDrugId] = useState("")
  const [dosageAmount, setDosageAmount] = useState("")
  const [dosageUnit, setDosageUnit] = useState<"cc" | "ml" | "doses">("cc")
  const [administrationRoute, setAdministrationRoute] = useState<"IM" | "SQ" | "IV" | "Oral" | "Intranasal">("IM")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [allCattle, setAllCattle] = useState<any[]>([])
  const [allInventory, setAllInventory] = useState<any[]>([])

  // Load all cattle and inventory
  useEffect(() => {
    const loadData = async () => {
      const [cattle, inventory] = await Promise.all([
        dataStore.getCattle(),
        inventoryService.getInventory()
      ])
      setAllCattle(cattle)
      setAllInventory(inventory)
    }
    if (open) {
      loadData()
    }
  }, [open])

  // Filter to only show drugs
  const drugs = useMemo(() =>
    allInventory.filter(item => isDrugCategory(item.category)),
    [allInventory]
  )

  // Get selected drug details
  const selectedDrug = useMemo(() =>
    drugs.find(d => d.id === selectedDrugId),
    [drugs, selectedDrugId]
  )

  // Get selected cattle details
  const selectedCattle = useMemo(() =>
    allCattle.filter(c => selectedCattleIds.includes(c.id)),
    [allCattle, selectedCattleIds]
  )

  // Calculate total cost and drug usage
  const calculations = useMemo(() => {
    if (!selectedDrug || !dosageAmount || selectedCattleIds.length === 0) {
      return {
        totalDrugNeeded: 0,
        costPerHead: 0,
        totalCost: 0,
        availableQuantity: 0,
        sufficient: false
      }
    }

    const dose = parseFloat(dosageAmount)
    const totalDrugNeeded = dose * selectedCattleIds.length
    const costPerHead = selectedDrug.costPerUnit * dose
    const totalCost = costPerHead * selectedCattleIds.length

    return {
      totalDrugNeeded,
      costPerHead,
      totalCost,
      availableQuantity: selectedDrug.quantityOnHand,
      sufficient: selectedDrug.quantityOnHand >= totalDrugNeeded
    }
  }, [selectedDrug, dosageAmount, selectedCattleIds])

  const handleSubmit = async () => {
    // Validation
    if (selectedCattleIds.length === 0) {
      toast({
        title: "No Cattle Selected",
        description: "Please select at least one animal to treat.",
        variant: "destructive",
      })
      return
    }

    if (!selectedDrugId) {
      toast({
        title: "No Drug Selected",
        description: "Please select a drug/medication.",
        variant: "destructive",
      })
      return
    }

    if (!dosageAmount || parseFloat(dosageAmount) <= 0) {
      toast({
        title: "Invalid Dosage",
        description: "Please enter a valid dosage amount.",
        variant: "destructive",
      })
      return
    }

    if (!calculations.sufficient) {
      toast({
        title: "Insufficient Inventory",
        description: `Need ${calculations.totalDrugNeeded}${dosageUnit}, but only have ${calculations.availableQuantity}${dosageUnit} available.`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process each cattle
      const successfulTreatments = []
      const failedTreatments = []

      for (const cattleId of selectedCattleIds) {
        const cattle = allCattle.find(c => c.id === cattleId)
        if (!cattle) {
          failedTreatments.push({ cattleId, error: "Cattle not found" })
          continue
        }

        try {
          const result = await healthService.recordTreatment({
            cattleId: cattle.id,
            cattleTagNumber: cattle.rfidTag || cattle.visualTag || cattle.tagNumber || cattle.id,
            drugName: selectedDrug!.name,
            drugInventoryId: selectedDrugId,
            dosageAmount: parseFloat(dosageAmount),
            dosageUnit: dosageUnit,
            administrationRoute: administrationRoute,
            withdrawalPeriod: selectedDrug!.withdrawalPeriod,
            cattleWeight: cattle.arrivalWeight || cattle.currentWeight,
            notes: notes,
            recordedBy: "Current User", // TODO: Get from auth context
            eventType: selectedDrug!.category === "vaccine" ? "vaccination" : "antibiotic-treatment"
          })

          successfulTreatments.push(result)
        } catch (error) {
          failedTreatments.push({
            cattleId,
            error: (error as Error).message
          })
        }
      }

      // Show results
      if (successfulTreatments.length > 0) {
        toast({
          title: "Treatment Recorded",
          description: `Successfully treated ${successfulTreatments.length} animal(s). Total cost: $${calculations.totalCost.toFixed(2)}`,
        })
      }

      if (failedTreatments.length > 0) {
        toast({
          title: "Some Treatments Failed",
          description: `${failedTreatments.length} treatment(s) failed. Check console for details.`,
          variant: "destructive",
        })
        console.error("Failed treatments:", failedTreatments)
      }

      // Reset form and close
      if (successfulTreatments.length > 0) {
        setSelectedCattleIds([])
        setSelectedDrugId("")
        setDosageAmount("")
        setNotes("")
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      toast({
        title: "Treatment Failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset pre-selected cattle when dialog opens
  useState(() => {
    if (open && preSelectedCattleIds.length > 0) {
      setSelectedCattleIds(preSelectedCattleIds)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Treatment Record</DialogTitle>
          <DialogDescription>
            Record a manual treatment for one or more cattle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cattle Selection */}
          <div className="space-y-2">
            <Label>Select Cattle *</Label>
            <Select
              value={selectedCattleIds.length === 1 ? selectedCattleIds[0] : "multiple"}
              onValueChange={(value) => {
                if (value !== "multiple") {
                  setSelectedCattleIds([value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cattle to treat">
                  {selectedCattleIds.length === 0 && "Select cattle to treat"}
                  {selectedCattleIds.length === 1 &&
                    allCattle.find(c => c.id === selectedCattleIds[0])?.rfidTag ||
                    allCattle.find(c => c.id === selectedCattleIds[0])?.visualTag ||
                    allCattle.find(c => c.id === selectedCattleIds[0])?.tagNumber ||
                    "Selected cattle"
                  }
                  {selectedCattleIds.length > 1 && `${selectedCattleIds.length} cattle selected`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allCattle.map((cattle) => (
                  <SelectItem key={cattle.id} value={cattle.id}>
                    {cattle.rfidTag || cattle.visualTag || cattle.tagNumber || cattle.id}
                    {cattle.currentWeight && ` - ${cattle.currentWeight} lbs`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCattleIds.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCattle.map(cattle => (
                  <Badge key={cattle.id} variant="secondary">
                    {cattle.rfidTag || cattle.visualTag || cattle.tagNumber}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tip: Use the Health page to select multiple cattle at once
            </p>
          </div>

          {/* Drug Selection */}
          <div className="space-y-2">
            <Label>Drug/Medication *</Label>
            <Select value={selectedDrugId} onValueChange={setSelectedDrugId}>
              <SelectTrigger>
                <SelectValue placeholder="Select drug or medication" />
              </SelectTrigger>
              <SelectContent>
                {drugs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No drugs in inventory
                  </SelectItem>
                ) : (
                  drugs.map((drug) => (
                    <SelectItem key={drug.id} value={drug.id}>
                      {drug.name} - {drug.quantityOnHand}{drug.unit} available
                      {drug.concentration && ` (${drug.concentration})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedDrug && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Available: {selectedDrug.quantityOnHand}{selectedDrug.unit}</div>
                <div>Cost: ${selectedDrug.costPerUnit.toFixed(2)}/{selectedDrug.unit}</div>
                {selectedDrug.withdrawalPeriod && (
                  <div>Withdrawal: {selectedDrug.withdrawalPeriod} days</div>
                )}
              </div>
            )}
          </div>

          {/* Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dosage Amount *</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={dosageUnit} onValueChange={(v) => setDosageUnit(v as typeof dosageUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc">cc</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="doses">doses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Administration Route */}
          <div className="space-y-2">
            <Label>Administration Route *</Label>
            <Select value={administrationRoute} onValueChange={(v) => setAdministrationRoute(v as typeof administrationRoute)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                <SelectItem value="SQ">SQ (Subcutaneous)</SelectItem>
                <SelectItem value="IV">IV (Intravenous)</SelectItem>
                <SelectItem value="Oral">Oral</SelectItem>
                <SelectItem value="Intranasal">Intranasal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Summary */}
          {calculations.totalCost > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Treatment Summary</div>
                  <div className="text-sm">
                    <div>Animals: {selectedCattleIds.length}</div>
                    <div>Drug needed: {calculations.totalDrugNeeded.toFixed(1)}{dosageUnit}</div>
                    <div>Cost per head: ${calculations.costPerHead.toFixed(2)}</div>
                    <div className="font-medium">Total cost: ${calculations.totalCost.toFixed(2)}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Insufficient inventory warning */}
          {selectedDrug && dosageAmount && !calculations.sufficient && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient inventory. Need {calculations.totalDrugNeeded.toFixed(1)}{dosageUnit} but only {calculations.availableQuantity.toFixed(1)}{dosageUnit} available.
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes about this treatment..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              selectedCattleIds.length === 0 ||
              !selectedDrugId ||
              !dosageAmount ||
              !calculations.sufficient
            }
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Treatment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
