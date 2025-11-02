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
import { useTaskStore } from "@/hooks/use-task-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useToast } from "@/hooks/use-toast"
import type { TaskType, TaskPriority } from "@/lib/task-store"

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { addTask, activeUsers } = useTaskStore()
  const { barns, pens } = usePenStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "general" as TaskType,
    priority: "medium" as TaskPriority,
    dueDate: "",
    assignedTo: "",
    barnId: "",
    penId: "",
    cattleId: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    addTask({
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      priority: formData.priority,
      status: "pending",
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo || undefined,
      barnId: formData.barnId || undefined,
      penId: formData.penId || undefined,
      cattleId: formData.cattleId || undefined,
      notes: formData.notes || undefined,
      createdBy: "current-user", // In a real app, this would be the logged-in user
    })

    toast({
      title: "Task created",
      description: "The task has been added to your list.",
    })

    // Reset form
    setFormData({
      title: "",
      description: "",
      type: "general",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      barnId: "",
      penId: "",
      cattleId: "",
      notes: "",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Create a new task or calendar event for your farm operations</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Feed cattle in Pen A"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Task Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as TaskType })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="feeding">Feeding</SelectItem>
                  <SelectItem value="health">Health Check</SelectItem>
                  <SelectItem value="vet-visit">Vet Visit</SelectItem>
                  <SelectItem value="breeding">Breeding</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barnId">Related Barn (Optional)</Label>
              <Select value={formData.barnId} onValueChange={(value) => setFormData({ ...formData, barnId: value, penId: "" })}>
                <SelectTrigger id="barnId">
                  <SelectValue placeholder="Select barn" />
                </SelectTrigger>
                <SelectContent>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penId">Related Pen (Optional)</Label>
              <Select value={formData.penId} onValueChange={(value) => setFormData({ ...formData, penId: value })} disabled={!formData.barnId}>
                <SelectTrigger id="penId">
                  <SelectValue placeholder="Select pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens
                    .filter((pen) => pen.barnId === formData.barnId)
                    .map((pen) => (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
