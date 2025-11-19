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
import { useHealthEnhanced } from "@/hooks/use-health-enhanced"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface AddDiseaseAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddDiseaseAlertDialog({ open, onOpenChange }: AddDiseaseAlertDialogProps) {
  const { addAlert } = useHealthEnhanced()
  const { toast } = useToast()

  const [disease, setDisease] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [affectedCattleIds, setAffectedCattleIds] = useState<string[]>([])
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [actions, setActions] = useState<string[]>([])
  const [currentAction, setCurrentAction] = useState("")

  const cattle = dataStore.getCattleSync().filter((c) => c.status === "Active")

  const handleAddAction = () => {
    if (currentAction.trim()) {
      setActions([...actions, currentAction.trim()])
      setCurrentAction("")
    }
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleToggleCattle = (cattleId: string) => {
    setAffectedCattleIds((prev) =>
      prev.includes(cattleId) ? prev.filter((id) => id !== cattleId) : [...prev, cattleId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      addAlert({
        disease,
        severity,
        affectedCattleIds,
        reportedDate,
        status: "active",
        notes: notes || undefined,
        actions,
      })

      toast({
        title: "Disease Alert Created",
        description: `Alert for ${disease} has been created.`,
        variant: severity === "critical" ? "destructive" : "default",
      })

      // Reset form
      setDisease("")
      setSeverity("medium")
      setAffectedCattleIds([])
      setReportedDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setActions([])
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to Create Alert",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Disease Alert</DialogTitle>
          <DialogDescription>Report a disease outbreak or health concern</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disease">Disease/Condition *</Label>
              <Input
                id="disease"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="e.g., Bovine Respiratory Disease"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor concern</SelectItem>
                  <SelectItem value="medium">Medium - Requires attention</SelectItem>
                  <SelectItem value="high">High - Urgent action needed</SelectItem>
                  <SelectItem value="critical">Critical - Emergency situation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedDate">Reported Date *</Label>
              <Input
                id="reportedDate"
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Affected Cattle ({affectedCattleIds.length} selected)</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-lg p-3 space-y-2">
                {cattle.map((animal) => (
                  <div
                    key={animal.id}
                    onClick={() => handleToggleCattle(animal.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      affectedCattleIds.includes(animal.id)
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm">
                      Tag #{animal.tagNumber} - {animal.breed}
                    </span>
                    {affectedCattleIds.includes(animal.id) && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Items</Label>
              <div className="flex gap-2">
                <Input
                  value={currentAction}
                  onChange={(e) => setCurrentAction(e.target.value)}
                  placeholder="Add action item..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAction())}
                />
                <Button type="button" onClick={handleAddAction} size="sm">
                  Add
                </Button>
              </div>
              {actions.length > 0 && (
                <div className="space-y-2">
                  {actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{action}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAction(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about the outbreak..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!disease || affectedCattleIds.length === 0}>
              Create Alert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
