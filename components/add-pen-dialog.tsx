"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { firebasePenStore, type Barn } from "@/lib/pen-store-firebase"
import { Loader2 } from "lucide-react"

interface AddPenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBarnId?: string
}

export function AddPenDialog({ open, onOpenChange, defaultBarnId }: AddPenDialogProps) {
  const { toast } = useToast()
  const [barns, setBarns] = useState<Barn[]>([])
  const [name, setName] = useState("")
  const [barnId, setBarnId] = useState(defaultBarnId || "")
  const [capacity, setCapacity] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load barns when dialog opens
    if (open) {
      setBarns(firebasePenStore.getBarns())
    }
  }, [open])

  useEffect(() => {
    if (defaultBarnId) {
      setBarnId(defaultBarnId)
    }
  }, [defaultBarnId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Pen name is required",
        variant: "destructive",
      })
      return
    }

    if (!barnId) {
      toast({
        title: "Error",
        description: "Please select a barn",
        variant: "destructive",
      })
      return
    }

    const capacityNum = parseInt(capacity)
    if (!capacity || isNaN(capacityNum) || capacityNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid capacity greater than 0",
        variant: "destructive",
      })
      return
    }

    const barn = barns.find(b => b.id === barnId)
    if (!barn) {
      toast({
        title: "Error",
        description: "Selected barn not found",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await firebasePenStore.addPen({
        name: name.trim(),
        barnId,
        capacity: capacityNum,
        notes: notes.trim() || undefined,
      })

      // Update barn totals
      await firebasePenStore.updateBarn(barnId, {
        totalPens: barn.totalPens + 1,
        totalCapacity: barn.totalCapacity + capacityNum,
      })

      toast({
        title: "Success",
        description: `Pen "${name}" created successfully`,
      })

      // Reset form
      setName("")
      setBarnId(defaultBarnId || "")
      setCapacity("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pen. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Pen</DialogTitle>
            <DialogDescription>
              Create a new pen within a barn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pen-barn">Barn *</Label>
              <Select value={barnId} onValueChange={setBarnId}>
                <SelectTrigger id="pen-barn">
                  <SelectValue placeholder="Select a barn" />
                </SelectTrigger>
                <SelectContent>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name} - {barn.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pen-name">Pen Name *</Label>
              <Input
                id="pen-name"
                placeholder="e.g., Pen 1, North Pen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pen-capacity">Capacity (head) *</Label>
              <Input
                id="pen-capacity"
                type="number"
                min="1"
                placeholder="e.g., 50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pen-notes">Notes</Label>
              <Textarea
                id="pen-notes"
                placeholder="Additional notes about this pen..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Pen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
