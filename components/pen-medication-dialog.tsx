"use client"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import type { Pen } from "@/lib/pen-store-firebase"

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

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [medicationName, setMedicationName] = useState("")
  const [purpose, setPurpose] = useState("")
  const [dosagePerHead, setDosagePerHead] = useState("")
  const [unit, setUnit] = useState("ml")
  const [costPerHead, setCostPerHead] = useState("")
  const [withdrawalPeriod, setWithdrawalPeriod] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pen) return

    if (!medicationName.trim()) {
      toast({
        title: "Validation Error",
        description: "Medication name is required",
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
    const cost = parseFloat(costPerHead)

    if (isNaN(dosage) || dosage <= 0) {
      toast({
        title: "Validation Error",
        description: "Dosage per head must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (isNaN(cost) || cost < 0) {
      toast({
        title: "Validation Error",
        description: "Cost per head must be a valid number",
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
      await addMedicationActivity({
        penId: pen.id,
        barnId: pen.barnId,
        date,
        medicationName: medicationName.trim(),
        purpose: purpose.trim(),
        dosagePerHead: dosage,
        unit,
        cattleCount: pen.currentCount,
        costPerHead: cost,
        withdrawalPeriod: withdrawalPeriod ? parseInt(withdrawalPeriod) : undefined,
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Medication Activity Recorded",
        description: `${medicationName} recorded for ${pen.name} (${pen.currentCount} head)`,
      })

      // Reset form
      setDate(new Date().toISOString().split("T")[0])
      setMedicationName("")
      setPurpose("")
      setDosagePerHead("")
      setCostPerHead("")
      setWithdrawalPeriod("")
      setNotes("")

      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record medication activity. Please try again.",
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
              <Label htmlFor="medicationName">Medication Name *</Label>
              <Input
                id="medicationName"
                placeholder="e.g., Draxxin, Excede, LA-200"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                required
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosagePerHead">Dosage Per Head *</Label>
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
                <Label htmlFor="unit">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="cc">CC</SelectItem>
                    <SelectItem value="mg">Milligrams (mg)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="doses">Doses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerHead">Cost Per Head *</Label>
              <Input
                id="costPerHead"
                type="number"
                step="0.01"
                min="0"
                placeholder="5.00"
                value={costPerHead}
                onChange={(e) => setCostPerHead(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Cost per animal treated (e.g., $5.00 per head)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalPeriod">Withdrawal Period (Days)</Label>
              <Input
                id="withdrawalPeriod"
                type="number"
                min="0"
                placeholder="28"
                value={withdrawalPeriod}
                onChange={(e) => setWithdrawalPeriod(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Days before cattle can be slaughtered or milk can be sold
              </p>
            </div>

            {pen && pen.currentCount > 0 && dosagePerHead && costPerHead && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Calculated Values:</p>
                <p className="text-sm text-muted-foreground">
                  Total dosage: {(parseFloat(dosagePerHead) * pen.currentCount).toFixed(2)} {unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total cost: ${(parseFloat(costPerHead) * pen.currentCount).toFixed(2)}
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
            <Button type="submit" disabled={loading || !pen}>
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
