"use client"

import type React from "react"

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

interface AddFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFeedDialog({ open, onOpenChange }: AddFeedDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "lbs",
    costPerUnit: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add feed to database
    onOpenChange(false)
    // Reset form
    setFormData({
      name: "",
      quantity: "",
      unit: "lbs",
      costPerUnit: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Feed Inventory</DialogTitle>
          <DialogDescription>Record a new feed purchase or inventory addition.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Feed Name</Label>
              <Input
                id="name"
                placeholder="e.g., Corn, Hay, Protein Supplement"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., lbs, tons"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPerUnit">Cost per Unit ($)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                placeholder="e.g., 0.18"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Feed</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
