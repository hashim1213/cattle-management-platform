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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, Package, Pill } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import { firebaseInventoryService } from "@/lib/inventory/inventory-service-firebase"
import { usePenStore } from "@/hooks/use-pen-store"
import type { InventoryItem } from "@/lib/inventory/inventory-types"
import type { Pen } from "@/lib/pen-store-firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isDrugCategory } from "@/lib/inventory/inventory-types"

interface QuickAddMedsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddMedsDialog({
  open,
  onOpenChange,
}: QuickAddMedsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { addMedicationActivity } = usePenActivity()
  const { pens, barns } = usePenStore()
  const [medications, setMedications] = useState<InventoryItem[]>([])

  const [selectedPenId, setSelectedPenId] = useState("")
  const [selectedMedicationId, setSelectedMedicationId] = useState("")
  const [dosagePerHead, setDosagePerHead] = useState("")

  // Load medications from inventory
  useEffect(() => {
    if (open) {
      const loadMedications = async () => {
        const inventory = await firebaseInventoryService.getInventory()
        const drugs = inventory.filter(item => isDrugCategory(item.category))
        setMedications(drugs)
      }
      loadMedications()
    }
  }, [open])

  // Get selected items
  const selectedPen = useMemo(() =>
    pens.find(p => p.id === selectedPenId),
    [pens, selectedPenId]
  )

  const selectedMedication = useMemo(() =>
    medications.find(m => m.id === selectedMedicationId),
    [medications, selectedMedicationId]
  )

  const selectedBarn = useMemo(() =>
    selectedPen ? barns.find(b => b.id === selectedPen.barnId) : null,
    [selectedPen, barns]
  )

  // Calculate values
  const calculations = useMemo(() => {
    if (!selectedMedication || !dosagePerHead || !selectedPen || selectedPen.currentCount === 0) {
      return {
        totalDosage: 0,
        costPerHead: 0,
        totalCost: 0,
        sufficientInventory: true
      }
    }

    const dosage = parseFloat(dosagePerHead)
    const totalDosage = dosage * selectedPen.currentCount
    const costPerHead = selectedMedication.costPerUnit * dosage
    const totalCost = costPerHead * selectedPen.currentCount
    const sufficientInventory = selectedMedication.quantityOnHand >= totalDosage

    return {
      totalDosage,
      costPerHead,
      totalCost,
      sufficientInventory
    }
  }, [selectedMedication, dosagePerHead, selectedPen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPen || !selectedMedication) {
      toast({
        title: "Validation Error",
        description: "Please select both a pen and medication",
        variant: "destructive",
      })
      return
    }

    const dosage = parseFloat(dosagePerHead)

    if (isNaN(dosage) || dosage <= 0) {
      toast({
        title: "Validation Error",
        description: "Dosage must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (!calculations.sufficientInventory) {
      toast({
        title: "Insufficient Inventory",
        description: `Need ${calculations.totalDosage.toFixed(1)}${selectedMedication.unit} but only ${selectedMedication.quantityOnHand.toFixed(1)}${selectedMedication.unit} available`,
        variant: "destructive",
      })
      return
    }

    if (selectedPen.currentCount === 0) {
      toast({
        title: "Warning",
        description: "This pen has no cattle",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Add medication activity which will automatically deduct inventory
      await addMedicationActivity({
        penId: selectedPen.id,
        barnId: selectedPen.barnId,
        date: new Date().toISOString().split("T")[0],
        medicationName: selectedMedication.name,
        medicationInventoryId: selectedMedicationId,
        purpose: "Quick Treatment",
        dosagePerHead: dosage,
        unit: selectedMedication.unit,
        cattleCount: selectedPen.currentCount,
        costPerHead: calculations.costPerHead,
        withdrawalPeriod: selectedMedication.withdrawalPeriod,
      })

      toast({
        title: "Medication Added",
        description: `${selectedMedication.name} recorded for ${selectedPen.name} (${selectedPen.currentCount} head). Total cost: $${calculations.totalCost.toFixed(2)}`,
      })

      // Reset form
      setSelectedPenId("")
      setSelectedMedicationId("")
      setDosagePerHead("")

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to add medication. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Quick Add Medication
            </DialogTitle>
            <DialogDescription>
              Quickly add medication to a pen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pen">Select Pen *</Label>
              <Select value={selectedPenId} onValueChange={setSelectedPenId} required>
                <SelectTrigger id="pen">
                  <SelectValue placeholder="Choose a pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No pens available
                    </SelectItem>
                  ) : (
                    pens.map((pen) => {
                      const barn = barns.find(b => b.id === pen.barnId)
                      return (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.name} ({barn?.name || 'N/A'}) - {pen.currentCount} head
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medication">Select Medication *</Label>
              <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId} required>
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Choose medication from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {medications.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No medications in inventory
                    </SelectItem>
                  ) : (
                    medications.map((med) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.name} - {med.quantityOnHand}{med.unit} available
                        {med.concentration && ` (${med.concentration})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedMedication && (
                <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Available: {selectedMedication.quantityOnHand}{selectedMedication.unit}
                  </div>
                  <div>Cost: ${selectedMedication.costPerUnit.toFixed(2)}/{selectedMedication.unit}</div>
                  {selectedMedication.withdrawalPeriod && (
                    <div>Withdrawal: {selectedMedication.withdrawalPeriod} days</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosagePerHead">Dosage Per Head ({selectedMedication?.unit || 'unit'}) *</Label>
              <Input
                id="dosagePerHead"
                type="number"
                step="0.01"
                min="0"
                placeholder="5.0"
                value={dosagePerHead}
                onChange={(e) => setDosagePerHead(e.target.value)}
                required
              />
            </div>

            {!calculations.sufficientInventory && selectedMedication && dosagePerHead && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient inventory! Need {calculations.totalDosage.toFixed(1)}{selectedMedication.unit} but only {selectedMedication.quantityOnHand.toFixed(1)}{selectedMedication.unit} available.
                </AlertDescription>
              </Alert>
            )}

            {selectedPen && selectedPen.currentCount > 0 && dosagePerHead && selectedMedication && calculations.sufficientInventory && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                <p className="text-sm font-medium">Summary:</p>
                <p className="text-sm">
                  Total dosage: <strong>{calculations.totalDosage.toFixed(2)} {selectedMedication.unit}</strong>
                </p>
                <p className="text-sm">
                  Cost per head: <strong>${calculations.costPerHead.toFixed(2)}</strong>
                </p>
                <p className="text-sm">
                  Total cost: <strong>${calculations.totalCost.toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !selectedPenId ||
                !selectedMedicationId ||
                !calculations.sufficientInventory ||
                (selectedPen && selectedPen.currentCount === 0)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Medication"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
