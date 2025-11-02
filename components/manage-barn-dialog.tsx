"use client"

import { useState, useEffect } from "react"
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
import { Save, Plus } from "lucide-react"
import type { Barn } from "@/lib/pen-store"

interface ManageBarnDialogProps {
  barn?: Barn | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (barn: Omit<Barn, "id" | "createdAt" | "updatedAt">) => void
}

export function ManageBarnDialog({ barn, open, onOpenChange, onSave }: ManageBarnDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    totalPens: 0,
    totalCapacity: 0,
    notes: "",
  })

  useEffect(() => {
    if (barn) {
      setFormData({
        name: barn.name,
        location: barn.location,
        totalPens: barn.totalPens,
        totalCapacity: barn.totalCapacity,
        notes: barn.notes || "",
      })
    } else {
      setFormData({
        name: "",
        location: "",
        totalPens: 0,
        totalCapacity: 0,
        notes: "",
      })
    }
  }, [barn, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{barn ? "Edit Barn" : "Add New Barn"}</DialogTitle>
          <DialogDescription>
            {barn ? "Update barn information" : "Create a new barn for your operation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Barn Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Main Barn, North Barn"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., North Field, Section A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalPens">Total Pens</Label>
              <Input
                id="totalPens"
                type="number"
                min="0"
                value={formData.totalPens}
                onChange={(e) => setFormData({ ...formData, totalPens: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCapacity">Total Capacity</Label>
              <Input
                id="totalCapacity"
                type="number"
                min="0"
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about this barn..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              {barn ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {barn ? "Save Changes" : "Add Barn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
