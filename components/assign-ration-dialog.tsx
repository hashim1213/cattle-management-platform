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
import { Badge } from "@/components/ui/badge"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { Input } from "@/components/ui/input"

interface AssignRationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignRationDialog({ open, onOpenChange }: AssignRationDialogProps) {
  const { activeRations, assignRationToPen, getPenAssignment } = useRationStore()
  const { pens } = usePenStore()
  const { toast } = useToast()

  const [selectedPenId, setSelectedPenId] = useState("")
  const [selectedRationId, setSelectedRationId] = useState("")
  const [startDate, setStartDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const pen = pens.find((p) => p.id === selectedPenId)
    const ration = activeRations.find((r) => r.id === selectedRationId)

    if (!pen || !ration) return

    // Get cattle count in pen
    const cattle = dataStore.getCattleSync().filter((c) => c.penId === selectedPenId)
    const headCount = cattle.length

    if (headCount === 0) {
      toast({
        title: "Empty Pen",
        description: "This pen has no cattle. Please add cattle before assigning a ration.",
        variant: "destructive",
      })
      return
    }

    try {
      assignRationToPen(
        pen.id,
        pen.name,
        ration.id,
        ration.name,
        headCount,
        startDate || undefined
      )

      toast({
        title: "Ration Assigned",
        description: `${ration.name} has been assigned to ${pen.name} (${headCount} head).`,
      })

      // Reset form
      setSelectedPenId("")
      setSelectedRationId("")
      setStartDate("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign ration.",
        variant: "destructive",
      })
    }
  }

  const selectedPen = pens.find((p) => p.id === selectedPenId)
  const selectedRation = activeRations.find((r) => r.id === selectedRationId)
  const currentAssignment = selectedPenId ? getPenAssignment(selectedPenId) : null

  const cattle = selectedPenId
    ? dataStore.getCattleSync().filter((c) => c.penId === selectedPenId)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Ration to Pen</DialogTitle>
          <DialogDescription>
            Link a feed ration to a pen to begin tracking consumption
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
                  {pens.map((pen) => {
                    const penCattle = dataStore.getCattleSync().filter((c) => c.penId === pen.id)
                    return (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name} - {penCattle.length} head
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {currentAssignment && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900">Current Assignment</p>
                <p className="text-sm text-amber-700">
                  {currentAssignment.rationName} - Will be replaced
                </p>
              </div>
            )}

            {selectedPen && cattle.length === 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Empty Pen</p>
                <p className="text-sm text-red-700">
                  This pen has no cattle. Add cattle before assigning a ration.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ration">Select Ration *</Label>
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
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to start immediately, or set a future date
              </p>
            </div>

            {selectedPen && selectedRation && cattle.length > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pen:</span>
                  <span className="text-sm font-medium">{selectedPen.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Head Count:</span>
                  <span className="text-sm font-medium">{cattle.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ration:</span>
                  <span className="text-sm font-medium">{selectedRation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Per Head/Day:</span>
                  <span className="text-sm font-medium">
                    {selectedRation.totalLbsPerHead.toFixed(2)} lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Daily Feed:</span>
                  <span className="text-sm font-bold">
                    {(selectedRation.totalLbsPerHead * cattle.length).toFixed(2)} lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Cost:</span>
                  <span className="text-sm font-bold">
                    ${(selectedRation.kpis.costPerHead * cattle.length).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPenId || !selectedRationId || cattle.length === 0}>
              Assign Ration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
