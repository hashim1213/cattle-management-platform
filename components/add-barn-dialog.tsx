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
import { useToast } from "@/hooks/use-toast"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { Loader2 } from "lucide-react"

interface AddBarnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBarnDialog({ open, onOpenChange }: AddBarnDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Barn name is required",
        variant: "destructive",
      })
      return
    }

    if (!location.trim()) {
      toast({
        title: "Error",
        description: "Location is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await firebasePenStore.addBarn({
        name: name.trim(),
        location: location.trim(),
        totalPens: 0,
        totalCapacity: 0,
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Success",
        description: `Barn "${name}" created successfully`,
      })

      // Reset form
      setName("")
      setLocation("")
      setNotes("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Barn creation error:", error)
      const errorMessage = error?.message || "Failed to create barn. Please try again."
      toast({
        title: "Error Creating Barn",
        description: errorMessage,
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
            <DialogTitle>Add New Barn</DialogTitle>
            <DialogDescription>
              Create a new barn to organize your pens
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="barn-name">Barn Name *</Label>
              <Input
                id="barn-name"
                placeholder="e.g., Barn A, North Barn"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barn-location">Location *</Label>
              <Input
                id="barn-location"
                placeholder="e.g., North Field, Main Facility"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barn-notes">Notes</Label>
              <Textarea
                id="barn-notes"
                placeholder="Additional notes about this barn..."
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
                "Create Barn"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
