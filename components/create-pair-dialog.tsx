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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePairsStore } from "@/hooks/use-pairs-store"
import { dataStore } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

interface CreatePairDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePairDialog({ open, onOpenChange }: CreatePairDialogProps) {
  const { createPair, getPairByCalf } = usePairsStore()
  const { toast } = useToast()

  const [damId, setDamId] = useState("")
  const [calfId, setCalfId] = useState("")
  const [pairDate, setPairDate] = useState("")
  const [birthWeight, setBirthWeight] = useState("")
  const [notes, setNotes] = useState("")

  const cattle = dataStore.getCattle()
  const availableDams = cattle.filter((c) => c.sex === "Cow" && c.status === "Active")
  const availableCalves = cattle.filter((c) => c.stage === "calf" && c.status === "Active")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Check if calf is already paired
      const existingPair = getPairByCalf(calfId)
      if (existingPair) {
        toast({
          title: "Cannot Create Pair",
          description: "This calf is already paired with another dam.",
          variant: "destructive",
        })
        return
      }

      createPair(
        damId,
        calfId,
        pairDate,
        birthWeight ? Number(birthWeight) : undefined,
        notes || undefined
      )

      toast({
        title: "Pair Created",
        description: "Dam-calf pair has been successfully created.",
      })

      // Reset form
      setDamId("")
      setCalfId("")
      setPairDate("")
      setBirthWeight("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to Create Pair",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const selectedDam = availableDams.find((c) => c.id === damId)
  const selectedCalf = availableCalves.find((c) => c.id === calfId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Dam-Calf Pair</DialogTitle>
          <DialogDescription>
            Link a mother cow with her nursing calf
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dam">Select Dam (Mother Cow) *</Label>
              <Select value={damId} onValueChange={setDamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cow" />
                </SelectTrigger>
                <SelectContent>
                  {availableDams.map((cow) => (
                    <SelectItem key={cow.id} value={cow.id}>
                      Tag #{cow.tagNumber} - {cow.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableDams.length === 0 && (
                <p className="text-xs text-amber-600">
                  No cows available. Add cows to your herd first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="calf">Select Calf *</Label>
              <Select value={calfId} onValueChange={setCalfId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a calf" />
                </SelectTrigger>
                <SelectContent>
                  {availableCalves.map((calf) => (
                    <SelectItem key={calf.id} value={calf.id}>
                      Tag #{calf.tagNumber} - {calf.breed} {calf.sex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCalves.length === 0 && (
                <p className="text-xs text-amber-600">
                  No calves available. Add calves to your herd first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pairDate">Birth/Pair Date *</Label>
              <Input
                id="pairDate"
                type="date"
                value={pairDate}
                onChange={(e) => setPairDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthWeight">Birth Weight (lbs)</Label>
              <Input
                id="birthWeight"
                type="number"
                value={birthWeight}
                onChange={(e) => setBirthWeight(e.target.value)}
                placeholder="e.g., 85"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this pair..."
                rows={3}
              />
            </div>

            {selectedDam && selectedCalf && pairDate && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Pair Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dam:</span>
                  <span className="font-medium">#{selectedDam.tagNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calf:</span>
                  <span className="font-medium">#{selectedCalf.tagNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Birth Date:</span>
                  <span className="font-medium">
                    {new Date(pairDate).toLocaleDateString()}
                  </span>
                </div>
                {birthWeight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Birth Weight:</span>
                    <span className="font-medium">{birthWeight} lbs</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!damId || !calfId || !pairDate}>
              Create Pair
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
