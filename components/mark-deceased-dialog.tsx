"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { Skull, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MarkDeceasedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cattle: Cattle | null
  onSuccess?: () => void
}

const DEATH_REASONS = [
  "Disease - Respiratory",
  "Disease - Digestive",
  "Disease - Metabolic",
  "Disease - Infectious",
  "Accident",
  "Calving complications",
  "Predator attack",
  "Unknown",
  "Other (specify in notes)",
]

export function MarkDeceasedDialog({ open, onOpenChange, cattle, onSuccess }: MarkDeceasedDialogProps) {
  const [deathReason, setDeathReason] = useState("")
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cattle || !deathReason) return

    setLoading(true)
    try {
      await firebaseDataStore.updateCattle(cattle.id, {
        status: "Deceased",
        deathDate,
        deathReason,
        notes: notes || cattle.notes,
      })

      // Reset form
      setDeathReason("")
      setDeathDate(new Date().toISOString().split("T")[0])
      setNotes("")

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to mark cattle as deceased:", error)
      alert("Failed to mark cattle as deceased. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Skull className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Mark Cattle as Deceased</DialogTitle>
              <DialogDescription>
                {cattle && `Record the death of ${cattle.tagNumber}${cattle.name ? ` (${cattle.name})` : ""}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deathDate">Date of Death *</Label>
            <Input
              id="deathDate"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deathReason">Reason for Death *</Label>
            <Select value={deathReason} onValueChange={setDeathReason} required>
              <SelectTrigger id="deathReason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DEATH_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about the cause of death, symptoms, or circumstances..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !deathReason}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking as Deceased...
                </>
              ) : (
                "Mark as Deceased"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
