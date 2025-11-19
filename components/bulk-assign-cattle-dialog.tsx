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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { firebaseDataStore as dataStore, type Cattle } from "@/lib/data-store-firebase"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import { Save, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BulkAssignCattleDialogProps {
  penId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function BulkAssignCattleDialog({
  penId,
  open,
  onOpenChange,
  onSave,
}: BulkAssignCattleDialogProps) {
  const { barns, pens, getPen, updatePenCount } = usePenStore()
  const { log } = useActivityStore()
  const [selectedPenId, setSelectedPenId] = useState(penId || "")
  const [selectedBarnId, setSelectedBarnId] = useState("")
  const [selectedCattle, setSelectedCattle] = useState<Set<string>>(new Set())

  const allCattle = dataStore.getCattle().filter((c) => c.status === "Active")
  const unassignedCattle = allCattle.filter((c) => !c.penId)

  const selectedPen = selectedPenId ? getPen(selectedPenId) : null
  const availableSpace = selectedPen
    ? selectedPen.capacity - selectedPen.currentCount
    : 0

  const barnPens = selectedBarnId ? pens.filter((p) => p.barnId === selectedBarnId) : []

  const toggleCattle = (cattleId: string) => {
    const newSelected = new Set(selectedCattle)
    if (newSelected.has(cattleId)) {
      newSelected.delete(cattleId)
    } else {
      newSelected.add(cattleId)
    }
    setSelectedCattle(newSelected)
  }

  const toggleAll = () => {
    if (selectedCattle.size === unassignedCattle.length) {
      setSelectedCattle(new Set())
    } else {
      setSelectedCattle(new Set(unassignedCattle.map((c) => c.id)))
    }
  }

  const handleSubmit = () => {
    if (!selectedPenId) return

    const cattleArray = Array.from(selectedCattle)
    const pen = getPen(selectedPenId)

    if (!pen) return

    // Update each cattle with pen and barn assignment
    cattleArray.forEach((cattleId) => {
      dataStore.updateCattle(cattleId, {
        penId: selectedPenId,
        barnId: pen.barnId,
      })
    })

    // Update pen count
    updatePenCount(selectedPenId, cattleArray.length)

    // Log the activity
    log({
      type: "cattle-added",
      entityType: "pen",
      entityId: selectedPenId,
      entityName: pen.name,
      title: `Added ${cattleArray.length} cattle to ${pen.name}`,
      description: `Assigned ${cattleArray.length} head of cattle to pen`,
      performedBy: "Owner",
    })

    onSave()
    onOpenChange(false)
    setSelectedCattle(new Set())
  }

  const canAssign = selectedCattle.size > 0 && selectedCattle.size <= availableSpace

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Assign Cattle to Pen</DialogTitle>
          <DialogDescription>
            Select cattle to assign to a pen. Only unassigned cattle are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pen Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Barn</Label>
              <Select
                value={selectedBarnId}
                onValueChange={(value) => {
                  setSelectedBarnId(value)
                  setSelectedPenId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a barn" />
                </SelectTrigger>
                <SelectContent>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Pen</Label>
              <Select value={selectedPenId} onValueChange={setSelectedPenId} disabled={!selectedBarnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pen" />
                </SelectTrigger>
                <SelectContent>
                  {barnPens.map((pen) => {
                    const available = pen.capacity - pen.currentCount
                    return (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name} ({available}/{pen.capacity} available)
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pen Info */}
          {selectedPen && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Pen:</span>
                <Badge variant="outline">{selectedPen.name}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available Space:</span>
                <span className="font-medium">{availableSpace} head</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Selected to Assign:</span>
                <span className="font-medium">{selectedCattle.size} head</span>
              </div>
            </div>
          )}

          {/* Warning if over capacity */}
          {selectedPen && selectedCattle.size > availableSpace && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>
                You've selected {selectedCattle.size} cattle but only {availableSpace} spaces available
              </span>
            </div>
          )}

          {/* Cattle List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Unassigned Cattle ({unassignedCattle.length})</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedCattle.size === unassignedCattle.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                {unassignedCattle.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No unassigned cattle available
                  </p>
                ) : (
                  unassignedCattle.map((cattle) => (
                    <div
                      key={cattle.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedCattle.has(cattle.id)}
                        onCheckedChange={() => toggleCattle(cattle.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Tag #{cattle.tagNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {cattle.breed}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {cattle.sex}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {cattle.stage}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canAssign} className="gap-2">
              <Save className="h-4 w-4" />
              Assign {selectedCattle.size} Cattle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
