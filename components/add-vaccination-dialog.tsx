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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHealthEnhanced } from "@/hooks/use-health-enhanced"
import { dataStore } from "@/lib/data-store-firebase"
import { useToast } from "@/hooks/use-toast"

interface AddVaccinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddVaccinationDialog({ open, onOpenChange }: AddVaccinationDialogProps) {
  const { addVaccination } = useHealthEnhanced()
  const { toast } = useToast()

  const [cattleId, setCattleId] = useState("")
  const [vaccineType, setVaccineType] = useState("")
  const [vaccineName, setVaccineName] = useState("")
  const [administeredDate, setAdministeredDate] = useState("")
  const [nextDueDate, setNextDueDate] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [administeredBy, setAdministeredBy] = useState("")
  const [notes, setNotes] = useState("")

  const cattle = dataStore.getCattle().filter((c) => c.status === "Active")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      addVaccination({
        cattleId,
        vaccineType,
        vaccineName,
        administeredDate,
        nextDueDate: nextDueDate || undefined,
        batchNumber: batchNumber || undefined,
        administeredBy,
        notes: notes || undefined,
      })

      toast({
        title: "Vaccination Recorded",
        description: "Vaccination has been successfully added to the records.",
      })

      // Reset form
      setCattleId("")
      setVaccineType("")
      setVaccineName("")
      setAdministeredDate("")
      setNextDueDate("")
      setBatchNumber("")
      setAdministeredBy("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to Record Vaccination",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Vaccination</DialogTitle>
          <DialogDescription>Add a vaccination record for cattle</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cattle">Select Cattle *</Label>
              <Select value={cattleId} onValueChange={setCattleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose cattle" />
                </SelectTrigger>
                <SelectContent>
                  {cattle.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      Tag #{animal.tagNumber} - {animal.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccineType">Vaccine Type *</Label>
              <Select value={vaccineType} onValueChange={setVaccineType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BVD">BVD (Bovine Viral Diarrhea)</SelectItem>
                  <SelectItem value="IBR">IBR (Infectious Bovine Rhinotracheitis)</SelectItem>
                  <SelectItem value="PI3">PI3 (Parainfluenza-3)</SelectItem>
                  <SelectItem value="BRSV">BRSV (Bovine Respiratory Syncytial Virus)</SelectItem>
                  <SelectItem value="Clostridial">Clostridial (7 or 8-way)</SelectItem>
                  <SelectItem value="Leptospirosis">Leptospirosis</SelectItem>
                  <SelectItem value="Vibriosis">Vibriosis</SelectItem>
                  <SelectItem value="Haemophilus">Haemophilus Somnus</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccineName">Vaccine Product Name *</Label>
              <Input
                id="vaccineName"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
                placeholder="e.g., Bovi-Shield Gold 5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="administeredDate">Administered Date *</Label>
                <Input
                  id="administeredDate"
                  type="date"
                  value={administeredDate}
                  onChange={(e) => setAdministeredDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  min={administeredDate || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch/Lot Number</Label>
              <Input
                id="batchNumber"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="administeredBy">Administered By *</Label>
              <Input
                id="administeredBy"
                value={administeredBy}
                onChange={(e) => setAdministeredBy(e.target.value)}
                placeholder="Name of person or veterinarian"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!cattleId || !vaccineType || !vaccineName || !administeredDate || !administeredBy}>
              Record Vaccination
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
