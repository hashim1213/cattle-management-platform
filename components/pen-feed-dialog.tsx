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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { usePenActivity } from "@/hooks/use-pen-activity"
import type { Pen } from "@/lib/pen-store-firebase"

interface PenFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pen: Pen | null
  onSuccess?: () => void
}

export function PenFeedDialog({
  open,
  onOpenChange,
  pen,
  onSuccess,
}: PenFeedDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { addFeedActivity } = usePenActivity()

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [feedType, setFeedType] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [unit, setUnit] = useState("lbs")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pen) return

    if (!feedType.trim()) {
      toast({
        title: "Validation Error",
        description: "Feed type is required",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(totalAmount)
    const cost = parseFloat(costPerUnit)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Total amount must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (isNaN(cost) || cost < 0) {
      toast({
        title: "Validation Error",
        description: "Cost per unit must be a valid number",
        variant: "destructive",
      })
      return
    }

    if (pen.currentCount === 0) {
      toast({
        title: "Warning",
        description: "This pen has no cattle. Feed activity will be recorded but per-cattle average will be 0.",
      })
    }

    setLoading(true)

    try {
      await addFeedActivity({
        penId: pen.id,
        barnId: pen.barnId,
        date,
        feedType: feedType.trim(),
        totalAmount: amount,
        unit,
        costPerUnit: cost,
        cattleCount: pen.currentCount,
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Feed Activity Recorded",
        description: `${amount} ${unit} of ${feedType} recorded for ${pen.name}`,
      })

      // Reset form
      setDate(new Date().toISOString().split("T")[0])
      setFeedType("")
      setTotalAmount("")
      setCostPerUnit("")
      setNotes("")

      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record feed activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Pen Feeding</DialogTitle>
            <DialogDescription>
              {pen ? (
                <>
                  Recording feed for <strong>{pen.name}</strong> ({pen.currentCount} cattle)
                </>
              ) : (
                "Select a pen to record feeding"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedType">Feed Type *</Label>
              <Input
                id="feedType"
                placeholder="e.g., Hay, Silage, Grain, TMR"
                value={feedType}
                onChange={(e) => setFeedType(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Type of feed given to the pen
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="bales">Bales</SelectItem>
                    <SelectItem value="bushels">Bushels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost Per Unit *</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.50"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Cost per {unit} (e.g., $0.50 per lb)
              </p>
            </div>

            {pen && pen.currentCount > 0 && totalAmount && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Calculated Values:</p>
                <p className="text-sm text-muted-foreground">
                  Average per cattle: {(parseFloat(totalAmount) / pen.currentCount).toFixed(2)} {unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total cost: ${(parseFloat(totalAmount || "0") * parseFloat(costPerUnit || "0")).toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this feeding..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
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
            <Button type="submit" disabled={loading || !pen}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Feed"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
