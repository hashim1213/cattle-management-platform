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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { usePenStore } from "@/hooks/use-pen-store"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { Checkbox } from "@/components/ui/checkbox"

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onComplete: () => void
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  onComplete,
}: BulkEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { pens = [], barns = [] } = usePenStore()
  const { stages } = useLifecycleConfig()

  // Fields to edit
  const [updateStage, setUpdateStage] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(false)
  const [updateHealthStatus, setUpdateHealthStatus] = useState(false)
  const [updatePen, setUpdatePen] = useState(false)
  const [updateSex, setUpdateSex] = useState(false)
  const [updateBreed, setUpdateBreed] = useState(false)
  const [updateCost, setUpdateCost] = useState(false)
  const [updateWeight, setUpdateWeight] = useState(false)

  // Values
  const [stage, setStage] = useState("")
  const [status, setStatus] = useState("")
  const [healthStatus, setHealthStatus] = useState("")
  const [penId, setPenId] = useState("")
  const [sex, setSex] = useState("")
  const [breed, setBreed] = useState("")
  const [cost, setCost] = useState("")
  const [weight, setWeight] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!updateStage && !updateStatus && !updateHealthStatus && !updatePen && !updateSex && !updateBreed && !updateCost && !updateWeight) {
      toast({
        title: "No Changes",
        description: "Please select at least one field to update",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Build updates object
      const updates: any = {}
      if (updateStage && stage) updates.stage = stage
      if (updateStatus && status) updates.status = status
      if (updateHealthStatus && healthStatus) updates.healthStatus = healthStatus
      if (updatePen && penId) {
        updates.penId = penId
        const pen = pens.find(p => p.id === penId)
        if (pen) {
          updates.barnId = pen.barnId
        }
      }
      if (updateSex && sex) updates.sex = sex
      if (updateBreed && breed) updates.breed = breed
      if (updateCost && cost) updates.purchasePrice = parseFloat(cost)
      if (updateWeight && weight) updates.weight = parseFloat(weight)

      // Update all selected cattle
      let successCount = 0
      for (const id of selectedIds) {
        try {
          await firebaseDataStore.updateCattle(id, updates)
          successCount++
        } catch (error) {
          console.error(`Failed to update cattle ${id}:`, error)
        }
      }

      toast({
        title: "Bulk Update Complete",
        description: `Successfully updated ${successCount} of ${selectedIds.length} cattle`,
      })

      // Reset form
      setUpdateStage(false)
      setUpdateStatus(false)
      setUpdateHealthStatus(false)
      setUpdatePen(false)
      setUpdateSex(false)
      setUpdateBreed(false)
      setUpdateCost(false)
      setUpdateWeight(false)
      setStage("")
      setStatus("")
      setHealthStatus("")
      setPenId("")
      setSex("")
      setBreed("")
      setCost("")
      setWeight("")

      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cattle. Please try again.",
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
            <DialogTitle>Bulk Edit Cattle</DialogTitle>
            <DialogDescription>
              Update {selectedIds.length} selected cattle. Only checked fields will be updated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Stage */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateStage"
                checked={updateStage}
                onCheckedChange={(checked) => setUpdateStage(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="stage">Lifecycle Stage</Label>
                <Select
                  value={stage}
                  onValueChange={setStage}
                  disabled={!updateStage}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateStatus"
                checked={updateStatus}
                onCheckedChange={(checked) => setUpdateStatus(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={!updateStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Health Status */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateHealthStatus"
                checked={updateHealthStatus}
                onCheckedChange={(checked) => setUpdateHealthStatus(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="healthStatus">Health Status</Label>
                <Select
                  value={healthStatus}
                  onValueChange={setHealthStatus}
                  disabled={!updateHealthStatus}
                >
                  <SelectTrigger id="healthStatus">
                    <SelectValue placeholder="Select health status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pen */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updatePen"
                checked={updatePen}
                onCheckedChange={(checked) => setUpdatePen(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="pen">Pen</Label>
                <Select
                  value={penId}
                  onValueChange={setPenId}
                  disabled={!updatePen}
                >
                  <SelectTrigger id="pen">
                    <SelectValue placeholder="Select pen" />
                  </SelectTrigger>
                  <SelectContent>
                    {pens.map((pen) => {
                      const barn = barns.find(b => b.id === pen.barnId)
                      return (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.name} {barn ? `(${barn.name})` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sex */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateSex"
                checked={updateSex}
                onCheckedChange={(checked) => setUpdateSex(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={sex}
                  onValueChange={setSex}
                  disabled={!updateSex}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bull">Bull</SelectItem>
                    <SelectItem value="Steer">Steer</SelectItem>
                    <SelectItem value="Heifer">Heifer</SelectItem>
                    <SelectItem value="Cow">Cow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Breed */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateBreed"
                checked={updateBreed}
                onCheckedChange={(checked) => setUpdateBreed(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Select
                  value={breed}
                  onValueChange={setBreed}
                  disabled={!updateBreed}
                >
                  <SelectTrigger id="breed">
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="angus">Angus</SelectItem>
                    <SelectItem value="hereford">Hereford</SelectItem>
                    <SelectItem value="charolais">Charolais</SelectItem>
                    <SelectItem value="simmental">Simmental</SelectItem>
                    <SelectItem value="limousin">Limousin</SelectItem>
                    <SelectItem value="brahman">Brahman</SelectItem>
                    <SelectItem value="crossbred">Crossbred</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateCost"
                checked={updateCost}
                onCheckedChange={(checked) => setUpdateCost(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="cost">Purchase Price</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="Enter cost"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  disabled={!updateCost}
                />
              </div>
            </div>

            {/* Weight */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="updateWeight"
                checked={updateWeight}
                onCheckedChange={(checked) => setUpdateWeight(checked as boolean)}
                className="mt-2"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  placeholder="Enter weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={!updateWeight}
                />
              </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${selectedIds.length} Cattle`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
