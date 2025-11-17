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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, Package } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import { firebaseInventoryService } from "@/lib/inventory/inventory-service-firebase"
import type { Pen } from "@/lib/pen-store-firebase"
import type { InventoryItem } from "@/lib/inventory/inventory-types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PenMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pen: Pen | null
  onSuccess?: () => void
}

export function PenMedicationDialog({
  open,
  onOpenChange,
  pen,
  onSuccess,
}: PenMedicationDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { addMedicationActivity } = usePenActivity()
  const [medications, setMedications] = useState<InventoryItem[]>([])

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedMedicationId, setSelectedMedicationId] = useState("")
  const [purpose, setPurpose] = useState("")
  const [dosagePerHead, setDosagePerHead] = useState("")
  const [withdrawalPeriod, setWithdrawalPeriod] = useState("")
  const [notes, setNotes] = useState("")

  // Load medications from inventory
  useEffect(() => {
    const loadMedications = async () => {
      const inventory = await firebaseInventoryService.getInventory()
      const drugItems = inventory.filter(item =>
        item.category === 'antibiotic' ||
        item.category === 'antiparasitic' ||
        item.category === 'vaccine' ||
        item.category === 'anti-inflammatory' ||
        item.category === 'hormone' ||
        item.category === 'vitamin-injectable' ||
        item.category === 'drug-other'
      )
      setMedications(drugItems)
    }
    if (open) {
      loadMedications()
    }
  }, [open])

  // Get selected medication details
  const selectedMedication = useMemo(() =>
    medications.find(m => m.id === selectedMedicationId),
    [medications, selectedMedicationId]
  )

  // Calculate total dosage, cost, and check availability
  const calculations = useMemo(() => {
    if (!selectedMedication || !dosagePerHead || !pen || pen.currentCount === 0) {
      return {
        totalDosage: 0,
        costPerHead: 0,
        totalCost: 0,
        available: true,
        sufficientInventory: true
      }
    }

    const dosage = parseFloat(dosagePerHead)
    const totalDosage = dosage * pen.currentCount
    const costPerHead = selectedMedication.costPerUnit * dosage
    const totalCost = costPerHead * pen.currentCount
    const sufficientInventory = selectedMedication.quantityOnHand >= totalDosage

    return {
      totalDosage,
      costPerHead,
      totalCost,
      sufficientInventory,
      available: selectedMedication.quantityOnHand
    }
  }, [selectedMedication, dosagePerHead, pen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pen) return

    if (!selectedMedicationId) {
      toast({
        title: "Validation Error",
        description: "Please select a medication from inventory",
        variant: "destructive",
      })
      return
    }

    if (!purpose.trim()) {
      toast({
        title: "Validation Error",
        description: "Purpose is required",
        variant: "destructive",
      })
      return
    }

    const dosage = parseFloat(dosagePerHead)

    if (isNaN(dosage) || dosage <= 0) {
      toast({
        title: "Validation Error",
        description: "Dosage per head must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (!calculations.sufficientInventory) {
      toast({
        title: "Insufficient Inventory",
        description: `Need ${calculations.totalDosage.toFixed(1)}${selectedMedication?.unit} but only ${calculations.available.toFixed(1)}${selectedMedication?.unit} available`,
        variant: "destructive",
      })
      return
    }

    if (pen.currentCount === 0) {
      toast({
        title: "Warning",
        description: "This pen has no cattle. Medication activity will be recorded but total dosage will be 0.",
      })
    }

    setLoading(true)

    try {
      // Add medication activity which will automatically deduct inventory
      await addMedicationActivity({
        penId: pen.id,
        barnId: pen.barnId,
        date,
        medicationName: selectedMedication!.name,
        medicationInventoryId: selectedMedicationId,
        purpose: purpose.trim(),
        dosagePerHead: dosage,
        unit: selectedMedication!.unit,
        cattleCount: pen.currentCount,
        costPerHead: calculations.costPerHead,
        withdrawalPeriod: withdrawalPeriod ? parseInt(withdrawalPeriod) : selectedMedication?.withdrawalPeriod,
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Medication Activity Recorded",
        description: `${selectedMedication!.name} recorded for ${pen.name} (${pen.currentCount} head). Total cost: $${calculations.totalCost.toFixed(2)}`,
      })

      // Reset form
      setDate(new Date().toISOString().split("T")[0])
      setSelectedMedicationId("")
      setPurpose("")
      setDosagePerHead("")
      setWithdrawalPeriod("")
      setNotes("")

      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to record medication activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Record Pen Medication</DialogTitle>
            <DialogDescription>
              {pen ? (
                <>
                  Recording medication for <strong>{pen.name}</strong> ({pen.currentCount} cattle)
                </>
              ) : (
                "Select a pen to record medication"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medication">Medication *</Label>
              <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId} required>
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Select medication from inventory" />
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
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={purpose} onValueChange={setPurpose} required>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                  <SelectItem value="Prevention">Prevention</SelectItem>
                  <SelectItem value="Vaccination">Vaccination</SelectItem>
                  <SelectItem value="Deworming">Deworming</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosagePerHead">Dosage Per Head * ({selectedMedication?.unit || 'unit'})</Label>
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

            <div className="space-y-2">
              <Label htmlFor="withdrawalPeriod">Withdrawal Period (Days)</Label>
              <Input
                id="withdrawalPeriod"
                type="number"
                min="0"
                placeholder={selectedMedication?.withdrawalPeriod?.toString() || "28"}
                value={withdrawalPeriod}
                onChange={(e) => setWithdrawalPeriod(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Days before cattle can be slaughtered or milk can be sold
                {selectedMedication?.withdrawalPeriod && ` (Default: ${selectedMedication.withdrawalPeriod} days)`}
              </p>
            </div>

            {!calculations.sufficientInventory && selectedMedication && dosagePerHead && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient inventory! Need {calculations.totalDosage.toFixed(1)}{selectedMedication.unit} but only {calculations.available.toFixed(1)}{selectedMedication.unit} available.
                </AlertDescription>
              </Alert>
            )}

            {pen && pen.currentCount > 0 && dosagePerHead && selectedMedication && calculations.sufficientInventory && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                <p className="text-sm font-medium">Calculated Values:</p>
                <p className="text-sm">
                  Total dosage: <strong>{calculations.totalDosage.toFixed(2)} {selectedMedication.unit}</strong>
                </p>
                <p className="text-sm">
                  Cost per head: <strong>${calculations.costPerHead.toFixed(2)}</strong>
                </p>
                <p className="text-sm">
                  Total cost: <strong>${calculations.totalCost.toFixed(2)}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Inventory will be automatically deducted
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this treatment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
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
                !pen ||
                !selectedMedicationId ||
                !calculations.sufficientInventory
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Medication"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
