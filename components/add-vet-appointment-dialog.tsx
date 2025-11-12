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
import { Badge } from "@/components/ui/badge"

interface AddVetAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddVetAppointmentDialog({ open, onOpenChange }: AddVetAppointmentDialogProps) {
  const { addAppointment } = useHealthEnhanced()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [veterinarianName, setVeterinarianName] = useState("")
  const [veterinarianContact, setVeterinarianContact] = useState("")
  const [cattleIds, setCattleIds] = useState<string[]>([])
  const [purpose, setPurpose] = useState<"routine_check" | "vaccination" | "treatment" | "surgery" | "emergency" | "other">("routine_check")
  const [notes, setNotes] = useState("")

  const cattle = dataStore.getCattle().filter((c) => c.status === "Active")

  const handleToggleCattle = (cattleId: string) => {
    setCattleIds((prev) =>
      prev.includes(cattleId) ? prev.filter((id) => id !== cattleId) : [...prev, cattleId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      addAppointment({
        title,
        description: description || undefined,
        appointmentDate,
        veterinarianName,
        veterinarianContact: veterinarianContact || undefined,
        cattleIds,
        purpose,
        status: "scheduled",
        notes: notes || undefined,
      })

      toast({
        title: "Appointment Scheduled",
        description: `Vet appointment on ${new Date(appointmentDate).toLocaleDateString()} has been created.`,
      })

      // Reset form
      setTitle("")
      setDescription("")
      setAppointmentDate("")
      setVeterinarianName("")
      setVeterinarianContact("")
      setCattleIds([])
      setPurpose("routine_check")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to Schedule Appointment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Vet Appointment</DialogTitle>
          <DialogDescription>Create a new veterinary appointment</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Annual Herd Check"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={purpose} onValueChange={(value) => setPurpose(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine_check">Routine Check</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date & Time *</Label>
              <Input
                id="appointmentDate"
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veterinarianName">Veterinarian Name *</Label>
                <Input
                  id="veterinarianName"
                  value={veterinarianName}
                  onChange={(e) => setVeterinarianName(e.target.value)}
                  placeholder="Dr. Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veterinarianContact">Contact Number</Label>
                <Input
                  id="veterinarianContact"
                  value={veterinarianContact}
                  onChange={(e) => setVeterinarianContact(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the appointment..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Cattle ({cattleIds.length} selected)</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-lg p-3 space-y-2">
                {cattle.map((animal) => (
                  <div
                    key={animal.id}
                    onClick={() => handleToggleCattle(animal.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      cattleIds.includes(animal.id)
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm">
                      Tag #{animal.tagNumber} - {animal.breed}
                    </span>
                    {cattleIds.includes(animal.id) && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !appointmentDate || !veterinarianName || cattleIds.length === 0}>
              Schedule Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
