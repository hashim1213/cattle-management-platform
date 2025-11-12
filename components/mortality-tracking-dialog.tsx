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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { dataStore, type Cattle } from "@/lib/data-store"
import { useTreatmentStore } from "@/hooks/use-treatment-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, DollarSign, Calendar } from "lucide-react"

interface MortalityTrackingDialogProps {
  cattleId?: string
  penId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MortalityTrackingDialog({
  cattleId,
  penId,
  open,
  onOpenChange,
}: MortalityTrackingDialogProps) {
  const { addMortalityRecord } = useTreatmentStore()
  const { pens, getPen, updatePenCount } = usePenStore()
  const { log } = useActivityStore()
  const { toast } = useToast()

  const preselectedCattle = cattleId ? dataStore.getCattleById(cattleId) : null

  const [formData, setFormData] = useState({
    cattleId: cattleId || "",
    penId: penId || preselectedCattle?.penId || "",
    dateOfDeath: new Date().toISOString().split("T")[0],
    causeOfDeath: "",
    category: "unknown" as "illness" | "injury" | "calving" | "predator" | "unknown" | "other",
    veterinarianConsulted: false,
    veterinarianName: "",
    necropsy: false,
    necropsyFindings: "",
    estimatedLoss: "",
    reportedBy: "Owner",
    notes: "",
  })

  const selectedCattle = formData.cattleId ? dataStore.getCattleById(formData.cattleId) : null
  const selectedPen = formData.penId ? getPen(formData.penId) : null

  // Auto-calculate estimated loss
  const autoCalculatedLoss = selectedCattle
    ? (selectedCattle.purchasePrice || 0) +
      (selectedCattle.currentValue || 0) / 2 // Average of purchase and current value
    : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCattle) {
      toast({
        title: "Error",
        description: "Please select a cattle to record mortality",
        variant: "destructive",
      })
      return
    }

    const estimatedLoss = formData.estimatedLoss
      ? parseFloat(formData.estimatedLoss)
      : autoCalculatedLoss

    // Calculate age
    const birthDate = new Date(selectedCattle.birthDate)
    const deathDate = new Date(formData.dateOfDeath)
    const ageInDays = Math.floor((deathDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
    const ageYears = Math.floor(ageInDays / 365)
    const ageMonths = Math.floor((ageInDays % 365) / 30)
    const ageString = `${ageYears}y ${ageMonths}m`

    // Add mortality record
    addMortalityRecord({
      cattleId: selectedCattle.id,
      penId: selectedPen?.id,
      barnId: selectedPen?.barnId,
      tagNumber: selectedCattle.tagNumber,
      breed: selectedCattle.breed,
      sex: selectedCattle.sex,
      age: ageString,
      dateOfDeath: formData.dateOfDeath,
      causeOfDeath: formData.causeOfDeath,
      category: formData.category,
      veterinarianConsulted: formData.veterinarianConsulted,
      veterinarianName: formData.veterinarianName || undefined,
      necropsy: formData.necropsy,
      necropsyFindings: formData.necropsyFindings || undefined,
      purchasePrice: selectedCattle.purchasePrice,
      estimatedLoss,
      reportedBy: formData.reportedBy,
      notes: formData.notes || undefined,
    })

    // Update cattle status to deceased
    dataStore.updateCattle(selectedCattle.id, {
      status: "Deceased",
    })

    // Update pen count if applicable
    if (selectedPen) {
      updatePenCount(selectedPen.id, -1)
    }

    // Log activity
    log({
      type: "cattle-removed",
      entityType: selectedPen ? "pen" : "general",
      entityId: selectedPen?.id,
      entityName: selectedPen?.name,
      title: `Mortality recorded: Tag #${selectedCattle.tagNumber}`,
      description: `${selectedCattle.breed} ${selectedCattle.sex} - ${formData.causeOfDeath}. Loss: $${estimatedLoss.toFixed(2)}`,
      performedBy: formData.reportedBy,
    })

    toast({
      title: "Mortality recorded",
      description: `Death of Tag #${selectedCattle.tagNumber} has been logged`,
    })

    // Reset form
    setFormData({
      cattleId: "",
      penId: "",
      dateOfDeath: new Date().toISOString().split("T")[0],
      causeOfDeath: "",
      category: "unknown",
      veterinarianConsulted: false,
      veterinarianName: "",
      necropsy: false,
      necropsyFindings: "",
      estimatedLoss: "",
      reportedBy: "Owner",
      notes: "",
    })

    onOpenChange(false)
  }

  const availableCattle = formData.penId
    ? dataStore.getCattle().filter((c) => c.penId === formData.penId && c.status === "Active")
    : dataStore.getCattle().filter((c) => c.status === "Active")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Record Mortality
          </DialogTitle>
          <DialogDescription>Log the death of cattle against a pen or group</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pen Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="penId">Pen (Optional)</Label>
            <Select
              value={formData.penId}
              onValueChange={(value) => setFormData({ ...formData, penId: value, cattleId: "" })}
            >
              <SelectTrigger id="penId">
                <SelectValue placeholder="Select pen or leave blank for all cattle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cattle</SelectItem>
                {pens.map((pen) => (
                  <SelectItem key={pen.id} value={pen.id}>
                    {pen.name} - {pen.currentCount} head
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cattle Selection */}
          <div className="space-y-2">
            <Label htmlFor="cattleId">Select Cattle *</Label>
            <Select
              value={formData.cattleId}
              onValueChange={(value) => {
                const cattle = dataStore.getCattleById(value)
                setFormData({
                  ...formData,
                  cattleId: value,
                  penId: cattle?.penId || formData.penId,
                })
              }}
              required
              disabled={!!cattleId}
            >
              <SelectTrigger id="cattleId">
                <SelectValue placeholder="Choose cattle" />
              </SelectTrigger>
              <SelectContent>
                {availableCattle.map((cattle) => (
                  <SelectItem key={cattle.id} value={cattle.id}>
                    Tag #{cattle.tagNumber} ({cattle.breed} {cattle.sex})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCattle && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tag Number</p>
                    <p className="font-semibold">{selectedCattle.tagNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Breed</p>
                    <p className="font-semibold">{selectedCattle.breed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Weight</p>
                    <p className="font-semibold">{selectedCattle.weight} lbs</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-semibold">
                      ${selectedCattle.purchasePrice?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="font-semibold">
                      ${selectedCattle.currentValue?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-semibold">
                      {Math.floor(
                        (Date.now() - new Date(selectedCattle.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
                      )}y{" "}
                      {Math.floor(
                        ((Date.now() - new Date(selectedCattle.birthDate).getTime()) % (1000 * 60 * 60 * 24 * 365)) /
                          (1000 * 60 * 60 * 24 * 30)
                      )}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfDeath">Date of Death *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateOfDeath"
                  type="date"
                  value={formData.dateOfDeath}
                  onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="calving">Calving Complication</SelectItem>
                  <SelectItem value="predator">Predator</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cause of Death */}
          <div className="space-y-2">
            <Label htmlFor="causeOfDeath">Cause of Death *</Label>
            <Input
              id="causeOfDeath"
              value={formData.causeOfDeath}
              onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
              placeholder="e.g., Pneumonia, Calving difficulty, Unknown illness"
              required
            />
          </div>

          {/* Veterinarian Consultation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="vetConsulted"
                checked={formData.veterinarianConsulted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, veterinarianConsulted: checked as boolean })
                }
              />
              <Label htmlFor="vetConsulted" className="cursor-pointer">
                Veterinarian consulted
              </Label>
            </div>

            {formData.veterinarianConsulted && (
              <Input
                placeholder="Veterinarian name"
                value={formData.veterinarianName}
                onChange={(e) => setFormData({ ...formData, veterinarianName: e.target.value })}
              />
            )}
          </div>

          {/* Necropsy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="necropsy"
                checked={formData.necropsy}
                onCheckedChange={(checked) => setFormData({ ...formData, necropsy: checked as boolean })}
              />
              <Label htmlFor="necropsy" className="cursor-pointer">
                Necropsy performed
              </Label>
            </div>

            {formData.necropsy && (
              <Textarea
                placeholder="Necropsy findings..."
                value={formData.necropsyFindings}
                onChange={(e) => setFormData({ ...formData, necropsyFindings: e.target.value })}
                rows={2}
              />
            )}
          </div>

          {/* Financial Loss */}
          <div className="space-y-2">
            <Label htmlFor="estimatedLoss">Estimated Financial Loss *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="estimatedLoss"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedLoss}
                onChange={(e) => setFormData({ ...formData, estimatedLoss: e.target.value })}
                className="pl-9"
                placeholder={`Auto-calculated: $${autoCalculatedLoss.toFixed(2)}`}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Leave blank to use auto-calculated value based on purchase price and current value
            </p>
          </div>

          {/* Reported By */}
          <div className="space-y-2">
            <Label htmlFor="reportedBy">Reported By *</Label>
            <Input
              id="reportedBy"
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information, circumstances, or observations..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Record Mortality
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
