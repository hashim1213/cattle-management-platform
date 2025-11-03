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
import { timeTrackingStore } from "@/lib/time-tracking-store"
import { taskStore } from "@/lib/task-store"
import { useToast } from "@/hooks/use-toast"

interface LogTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogTimeDialog({ open, onOpenChange }: LogTimeDialogProps) {
  const { toast } = useToast()
  const users = taskStore.getUsers()

  const [formData, setFormData] = useState({
    userId: users[0]?.id || "",
    userName: users[0]?.name || "Owner",
    operationType: "feeding" as const,
    description: "",
    hours: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    timeTrackingStore.addEntry({
      userId: formData.userId,
      userName: formData.userName,
      operationType: formData.operationType,
      description: formData.description,
      hours: parseFloat(formData.hours),
      date: formData.date,
      notes: formData.notes || undefined,
    })

    toast({
      title: "Time Logged",
      description: `${formData.hours} hours logged for ${formData.description}`,
    })

    // Reset form
    setFormData({
      userId: users[0]?.id || "",
      userName: users[0]?.name || "Owner",
      operationType: "feeding",
      description: "",
      hours: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    })

    onOpenChange(false)
  }

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setFormData({
        ...formData,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>Record hours spent on farm operations</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">Team Member *</Label>
                <Select value={formData.userId} onValueChange={handleUserChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter((u) => u.active).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operationType">Operation Type *</Label>
              <Select
                value={formData.operationType}
                onValueChange={(value: any) => setFormData({ ...formData, operationType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeding">Feeding</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="health-check">Health Check</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="moving-cattle">Moving Cattle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="pen-setup">Pen Setup</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Cleaning Barn 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g., 2.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Time</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
