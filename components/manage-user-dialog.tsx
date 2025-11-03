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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { userRolesStore, type User } from "@/lib/user-roles-store"
import { useToast } from "@/hooks/use-toast"

interface ManageUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function ManageUserDialog({ user, open, onOpenChange, onSave }: ManageUserDialogProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "team-member" as User["role"],
    active: true,
    pin: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        active: user.active,
        pin: user.pin || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "team-member",
        active: true,
        pin: "",
      })
    }
  }, [user, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role,
      active: formData.active,
      pin: formData.pin || undefined,
    }

    if (user) {
      userRolesStore.updateUser(user.id, userData)
      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      })
    } else {
      userRolesStore.addUser(userData)
      toast({
        title: "User Created",
        description: "New user has been successfully created.",
      })
    }

    onSave()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update user information and permissions" : "Add a new team member"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: User["role"]) => setFormData({ ...formData, role: value })}
                disabled={user?.role === "owner"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (Full Access)</SelectItem>
                  <SelectItem value="manager">Manager (Most Access)</SelectItem>
                  <SelectItem value="team-member">Team Member (Limited Access)</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian (Health Records)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === "owner" && "Full access to all features"}
                {formData.role === "manager" && "Can manage most operations, no financial editing"}
                {formData.role === "team-member" && "Can view cattle, edit assigned tasks, log time"}
                {formData.role === "veterinarian" && "Can view/edit health records only"}
                {formData.role === "viewer" && "Read-only access to cattle and reports"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN (4 digits for mobile login)</Label>
              <Input
                id="pin"
                type="text"
                maxLength={4}
                pattern="[0-9]{4}"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="1234"
              />
              <p className="text-xs text-muted-foreground">
                Optional 4-digit PIN for quick mobile login
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="active">Active Account</Label>
                <p className="text-sm text-muted-foreground">User can log in and access system</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{user ? "Update" : "Create"} User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
