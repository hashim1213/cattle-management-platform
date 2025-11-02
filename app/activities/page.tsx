"use client"

import { useState } from "react"
import { Activity, Filter, Calendar, User, Building2, Beef, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useActivityStore } from "@/hooks/use-activity-store"
import { useTaskStore } from "@/hooks/use-task-store"
import { ActivityLogItem } from "@/components/activity-log-item"
import { AddActivityDialog } from "@/components/add-activity-dialog"
import type { ActivityType, EntityType } from "@/lib/activity-store"

export default function ActivitiesPage() {
  const { activities, getStats, getTodayActivities } = useActivityStore()
  const { activeUsers } = useTaskStore()
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false)

  // Filters
  const [filterEntityType, setFilterEntityType] = useState<EntityType | "all">("all")
  const [filterActivityType, setFilterActivityType] = useState<ActivityType | "all">("all")
  const [filterUser, setFilterUser] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all">("all")

  // Get date range based on filter
  const getDateRange = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "today":
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return { start: today.toISOString(), end: tomorrow.toISOString() }
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo.toISOString(), end: new Date().toISOString() }
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { start: monthAgo.toISOString(), end: new Date().toISOString() }
      default:
        return undefined
    }
  }

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    if (filterEntityType !== "all" && activity.entityType !== filterEntityType) return false
    if (filterActivityType !== "all" && activity.type !== filterActivityType) return false
    if (filterUser !== "all" && activity.performedBy !== filterUser) return false
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !activity.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false

    const dateRange = getDateRange()
    if (dateRange) {
      const timestamp = new Date(activity.timestamp)
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      if (timestamp < start || timestamp > end) return false
    }

    return true
  })

  const todayActivities = getTodayActivities()
  const stats = getStats(getDateRange())

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activity Logs</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track all activities across pens, barns, and cattle
              </p>
            </div>
            <Button onClick={() => setIsAddActivityOpen(true)} className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Log Activity</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{todayActivities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pens/Barns</p>
                  <p className="text-2xl font-bold">
                    {(stats.byEntity.pen || 0) + (stats.byEntity.barn || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Beef className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cattle</p>
                  <p className="text-2xl font-bold">{stats.byEntity.cattle || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={filterEntityType} onValueChange={(v) => setFilterEntityType(v as EntityType | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="pen">Pens</SelectItem>
                    <SelectItem value="barn">Barns</SelectItem>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={filterActivityType} onValueChange={(v) => setFilterActivityType(v as ActivityType | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
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
                <Label>Performed By</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {activeUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label>Search</Label>
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log ({filteredActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {filteredActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activities found</p>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <ActivityLogItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Add Activity Dialog */}
      <AddActivityDialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen} />
    </div>
  )
}
