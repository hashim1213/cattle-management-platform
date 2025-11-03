"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Shield, Users as UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { userRolesStore, type User } from "@/lib/user-roles-store"
import { useToast } from "@/hooks/use-toast"
import { ManageUserDialog } from "@/components/manage-user-dialog"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [manageUserDialogOpen, setManageUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  const loadUsers = () => {
    setUsers(userRolesStore.getUsers())
  }

  useEffect(() => {
    loadUsers()
    const unsubscribe = userRolesStore.subscribe(loadUsers)
    return unsubscribe
  }, [])

  const handleAddUser = () => {
    setEditingUser(null)
    setManageUserDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setManageUserDialogOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      if (userRolesStore.deleteUser(userId)) {
        toast({
          title: "User Deleted",
          description: "The user has been successfully removed.",
        })
        loadUsers()
      } else {
        toast({
          title: "Cannot Delete User",
          description: "Owner account cannot be deleted.",
          variant: "destructive",
        })
      }
    }
  }

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "owner":
        return "default"
      case "manager":
        return "secondary"
      case "team-member":
        return "outline"
      case "veterinarian":
        return "outline"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  const activeUsers = users.filter((u) => u.active)
  const inactiveUsers = users.filter((u) => !u.active)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage team members, roles, and permissions
              </p>
            </div>
            <Button size="sm" onClick={handleAddUser}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add User</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {activeUsers.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{inactiveUsers.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Team members with active accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role.replace("-", " ")}
                      </Badge>
                      {user.pin && <Badge variant="outline">PIN Set</Badge>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-1">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-1">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.role !== "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        {inactiveUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Inactive Users</CardTitle>
              <CardDescription>Deactivated team member accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inactiveUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        <Badge variant="outline">{user.role.replace("-", " ")}</Badge>
                        <Badge variant="destructive">Inactive</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialogs */}
      <ManageUserDialog
        user={editingUser}
        open={manageUserDialogOpen}
        onOpenChange={setManageUserDialogOpen}
        onSave={loadUsers}
      />
    </div>
  )
}
