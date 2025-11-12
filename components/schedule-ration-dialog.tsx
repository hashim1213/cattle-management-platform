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
import { useRationStore } from "@/hooks/use-ration-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "lucide-react"

interface ScheduleRationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleRationDialog({ open, onOpenChange }: ScheduleRationDialogProps) {
  const { activeRations, scheduleRationChange, getPenAssignment } = useRationStore()
  const { pens } = usePenStore()
  const { toast } = useToast()

  const [selectedPenId, setSelectedPenId] = useState("")
  const [selectedRationId, setSelectedRationId] = useState("")
  const [triggerDate, setTriggerDate] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const pen = pens.find((p) => p.id === selectedPenId)
    const ration = activeRations.find((r) => r.id === selectedRationId)

    if (!pen || !ration) return

    const currentAssignment = getPenAssignment(selectedPenId)

    try {
      scheduleRationChange(
        selectedPenId,
        selectedRationId,
        triggerDate,
        currentAssignment?.rationId,
        notes || undefined
      )

      toast({
        title: "Ration Change Scheduled",
        description: `${ration.name} will be assigned to ${pen.name} on ${new Date(triggerDate).toLocaleDateString()}.`,
      })

      // Reset form
      setSelectedPenId("")
      setSelectedRationId("")
      setTriggerDate("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: error instanceof Error ? error.message : "Failed to schedule ration change.",
        variant: "destructive",
      })
    }
  }

  const currentAssignment = selectedPenId ? getPenAssignment(selectedPenId) : null
  const selectedRation = activeRations.find((r) => r.id === selectedRationId)
  const selectedPen = pens.find((p) => p.id === selectedPenId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Ration Change
          </DialogTitle>
          <DialogDescription>
            Set up automatic ration changes on a specific trigger date
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pen">Select Pen *</Label>
              <Select value={selectedPenId} onValueChange={setSelectedPenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens.map((pen) => (
                    <SelectItem key={pen.id} value={pen.id}>
                      {pen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentAssignment && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Current Ration</p>
                <p className="text-sm text-blue-700">{currentAssignment.rationName}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Will transition to new ration on trigger date
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ration">New Ration *</Label>
              <Select value={selectedRationId} onValueChange={setSelectedRationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a ration" />
                </SelectTrigger>
                <SelectContent>
                  {activeRations.map((ration) => (
                    <SelectItem key={ration.id} value={ration.id}>
                      {ration.name} ({ration.stage})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerDate">Trigger Date *</Label>
              <Input
                id="triggerDate"
                type="date"
                value={triggerDate}
                onChange={(e) => setTriggerDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              <p className="text-xs text-muted-foreground">
                The ration will automatically change on this date
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for change, special instructions, etc."
                rows={3}
              />
            </div>

            {selectedPen && selectedRation && triggerDate && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm mb-2">Scheduled Change Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pen:</span>
                  <span className="font-medium">{selectedPen.name}</span>
                </div>
                {currentAssignment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">From Ration:</span>
                    <span className="font-medium">{currentAssignment.rationName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Ration:</span>
                  <span className="font-medium">{selectedRation.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trigger Date:</span>
                  <span className="font-medium">
                    {new Date(triggerDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days Until Change:</span>
                  <span className="font-medium">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(triggerDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPenId || !selectedRationId || !triggerDate}>
              Schedule Change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
