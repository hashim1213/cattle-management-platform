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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Plus } from "lucide-react"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import type { Pen } from "@/lib/pen-store-firebase"

interface ManagePenDialogProps {
  pen?: Pen | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManagePenDialog({ pen, open, onOpenChange }: ManagePenDialogProps) {
  const { barns = [], addPen, updatePen } = usePenStore()
  const { log } = useActivityStore()
  const [formData, setFormData] = useState({
    name: "",
    barnId: "",
    capacity: 30,
    notes: "",
    location: {
      x: 50,
      y: 50,
      width: 150,
      height: 100,
    },
  })

  useEffect(() => {
    if (pen) {
      setFormData({
        name: pen.name,
        barnId: pen.barnId,
        capacity: pen.capacity,
        notes: pen.notes || "",
        location: pen.location || { x: 50, y: 50, width: 150, height: 100 },
      })
    } else {
      // Auto-select first barn if available
      setFormData({
        name: "",
        barnId: barns[0]?.id || "",
        capacity: 30,
        notes: "",
        location: {
          x: 50,
          y: 50,
          width: 150,
          height: 100,
        },
      })
    }
  }, [pen, open, barns])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (pen) {
      // Update existing pen
      updatePen(pen.id, formData)
      log({
        type: "pen-updated",
        entityType: "pen",
        entityId: pen.id,
        entityName: formData.name,
        title: `Updated pen: ${formData.name}`,
        description: `Modified pen details`,
        performedBy: "Owner",
      })
    } else {
      // Add new pen
      addPen(formData)
      log({
        type: "pen-created",
        entityType: "pen",
        entityId: crypto.randomUUID(),
        entityName: formData.name,
        title: `Created pen: ${formData.name}`,
        description: `Added new pen with capacity ${formData.capacity}`,
        performedBy: "Owner",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{pen ? "Edit Pen" : "Add New Pen"}</DialogTitle>
          <DialogDescription>
            {pen ? "Update pen information and layout" : "Create a new pen in a barn"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pen Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Pen A, Finishing 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barnId">Barn *</Label>
              <Select
                value={formData.barnId}
                onValueChange={(value) => setFormData({ ...formData, barnId: value })}
                required
              >
                <SelectTrigger id="barnId">
                  <SelectValue placeholder="Select barn" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Head) *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              required
            />
          </div>

          {pen && (
            <>
              {/* Layout Position - Only shown when editing */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Layout Position (for visual map)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="x" className="text-sm">X Position</Label>
                    <Input
                      id="x"
                      type="number"
                      min="0"
                      max="480"
                      value={formData.location.x}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, x: Number(e.target.value) },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="y" className="text-sm">Y Position</Label>
                    <Input
                      id="y"
                      type="number"
                      min="0"
                      max="380"
                      value={formData.location.y}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, y: Number(e.target.value) },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-sm">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      min="80"
                      max="200"
                      value={formData.location.width}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, width: Number(e.target.value) },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      min="80"
                      max="150"
                      value={formData.location.height}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, height: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <svg width="100%" height="120" viewBox="0 0 500 120" className="border rounded bg-gradient-to-br from-amber-100 to-amber-200">
                    <rect
                      x={formData.location.x}
                      y={10}
                      width={formData.location.width}
                      height={formData.location.height}
                      fill="#9cb378"
                      fillOpacity="0.4"
                      stroke="#654321"
                      strokeWidth="3"
                      rx="2"
                    />
                    <text
                      x={formData.location.x + formData.location.width / 2}
                      y={10 + formData.location.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold fill-foreground"
                    >
                      {formData.name || "Pen Name"}
                    </text>
                  </svg>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about this pen..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              {pen ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {pen ? "Save Changes" : "Add Pen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
