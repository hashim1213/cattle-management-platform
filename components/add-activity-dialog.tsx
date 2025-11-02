"use client"

import { useState } from "react"
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
import { useActivityStore } from "@/hooks/use-activity-store"
import { useTaskStore } from "@/hooks/use-task-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useToast } from "@/hooks/use-toast"
import type { ActivityType, EntityType } from "@/lib/activity-store"

interface AddActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddActivityDialog({ open, onOpenChange }: AddActivityDialogProps) {
  const { log } = useActivityStore()
  const { activeUsers } = useTaskStore()
  const { barns, pens } = usePenStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    type: "feeding" as ActivityType,
    entityType: "pen" as EntityType,
    entityId: "",
    title: "",
    description: "",
    performedBy: activeUsers[0]?.id || "Owner",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entityName = formData.entityId
      ? formData.entityType === "barn"
        ? barns.find((b) => b.id === formData.entityId)?.name
        : formData.entityType === "pen"
          ? pens.find((p) => p.id === formData.entityId)?.name
          : undefined
      : undefined

    log({
      type: formData.type,
      entityType: formData.entityType,
      entityId: formData.entityId || undefined,
      entityName,
      title: formData.title,
      description: formData.description || undefined,
      performedBy: formData.performedBy,
    })

    toast({
      title: "Activity logged",
      description: "The activity has been added to the log.",
    })

    // Reset form
    setFormData({
      type: "feeding",
      entityType: "pen",
      entityId: "",
      title: "",
      description: "",
      performedBy: activeUsers[0]?.id || "Owner",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>Record what was done and who did it</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ActivityType })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeding">Feeding</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="health-check">Health Check</SelectItem>
                  <SelectItem value="vet-visit">Vet Visit</SelectItem>
                  <SelectItem value="cattle-added">Cattle Added</SelectItem>
                  <SelectItem value="cattle-removed">Cattle Removed</SelectItem>
                  <SelectItem value="cattle-moved">Cattle Moved</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performedBy">Performed By *</Label>
              <Select value={formData.performedBy} onValueChange={(value) => setFormData({ ...formData, performedBy: value })}>
                <SelectTrigger id="performedBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Fed cattle in Pen A"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityType">Related To *</Label>
              <Select value={formData.entityType} onValueChange={(value) => setFormData({ ...formData, entityType: value as EntityType, entityId: "" })}>
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pen">Pen</SelectItem>
                  <SelectItem value="barn">Barn</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityId">Select {formData.entityType}</Label>
              <Select value={formData.entityId} onValueChange={(value) => setFormData({ ...formData, entityId: value })}>
                <SelectTrigger id="entityId">
                  <SelectValue placeholder={`Select ${formData.entityType}`} />
                </SelectTrigger>
                <SelectContent>
                  {formData.entityType === "barn" &&
                    barns.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name}
                      </SelectItem>
                    ))}
                  {formData.entityType === "pen" &&
                    pens.map((pen) => (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about what was done..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Activity</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
