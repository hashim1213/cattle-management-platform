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
import { Badge } from "@/components/ui/badge"
import { usePairsStore } from "@/hooks/use-pairs-store"
import { dataStore } from "@/lib/data-store-firebase"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, TrendingUp, Calendar } from "lucide-react"
import type { CattlePair } from "@/lib/pairs-store"

interface WeanCalfDialogProps {
  pair: CattlePair | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeanCalfDialog({ pair, open, onOpenChange }: WeanCalfDialogProps) {
  const { weanCalf } = usePairsStore()
  const { toast } = useToast()

  const [weanDate, setWeanDate] = useState("")
  const [weanWeight, setWeanWeight] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open && pair) {
      // Set default wean date to today
      setWeanDate(new Date().toISOString().split("T")[0])

      // Get current calf weight if available
      const calf = dataStore.getCattle().find((c) => c.id === pair.calfId)
      if (calf) {
        const currentWeight = calf.weights?.[calf.weights.length - 1]?.weight || calf.weight
        if (currentWeight) {
          setWeanWeight(currentWeight.toString())
        }
      }
    }
  }, [open, pair])

  if (!pair) return null

  const dam = dataStore.getCattle().find((c) => c.id === pair.damId)
  const calf = dataStore.getCattle().find((c) => c.id === pair.calfId)

  if (!dam || !calf) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      weanCalf(pair.id, Number(weanWeight), weanDate, notes || undefined)

      toast({
        title: "Calf Weaned Successfully",
        description: `Calf #${calf.tagNumber} has been weaned and moved to Weaned Calves.`,
      })

      // Reset form
      setWeanWeight("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to Wean Calf",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  // Calculate age
  const birthDate = new Date(pair.pairDate)
  const weaningDate = weanDate ? new Date(weanDate) : new Date()
  const ageInDays = Math.floor(
    (weaningDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const ageInMonths = (ageInDays / 30).toFixed(1)

  // Calculate weight gain
  const birthWeight = pair.birthWeight || 0
  const currentWeanWeight = Number(weanWeight) || 0
  const totalGain = currentWeanWeight - birthWeight
  const adg = ageInDays > 0 ? totalGain / ageInDays : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Wean Calf
          </DialogTitle>
          <DialogDescription>
            Record weaning and transfer calf to Weaned Calves section
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Pair Information */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm mb-2">Current Pair Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Dam:</span>
                <span className="ml-2 font-medium">#{dam.tagNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Calf:</span>
                <span className="ml-2 font-medium">#{calf.tagNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Birth Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(pair.pairDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Age:</span>
                <span className="ml-2 font-medium">{ageInDays} days</span>
              </div>
              {pair.birthWeight && (
                <div>
                  <span className="text-muted-foreground">Birth Weight:</span>
                  <span className="ml-2 font-medium">{pair.birthWeight} lbs</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weanDate">Weaning Date *</Label>
              <Input
                id="weanDate"
                type="date"
                value={weanDate}
                onChange={(e) => setWeanDate(e.target.value)}
                min={pair.pairDate}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weanWeight">Weaning Weight (lbs) *</Label>
              <Input
                id="weanWeight"
                type="number"
                value={weanWeight}
                onChange={(e) => setWeanWeight(e.target.value)}
                placeholder="e.g., 550"
                min="0"
                step="0.1"
                required
              />
            </div>

            {weanWeight && Number(weanWeight) > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-green-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Weaning Performance
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-green-700">Age at Weaning:</span>
                    <span className="ml-2 font-medium text-green-900">
                      {ageInMonths} months ({ageInDays} days)
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Wean Weight:</span>
                    <span className="ml-2 font-medium text-green-900">{weanWeight} lbs</span>
                  </div>
                  {birthWeight > 0 && (
                    <>
                      <div>
                        <span className="text-green-700">Total Gain:</span>
                        <span className="ml-2 font-medium text-green-900">
                          {totalGain.toFixed(0)} lbs
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700">ADG:</span>
                        <span className="ml-2 font-medium text-green-900">
                          {adg.toFixed(2)} lbs/day
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condition, health notes, etc..."
                rows={3}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calf will be moved to <strong>Weaned Calves</strong> and dam will be marked as open
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!weanDate || !weanWeight}>
                Wean Calf
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
