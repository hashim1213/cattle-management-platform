"use client"

import { useState } from "react"
import { Plus, Calendar, List, CheckCircle2, Clock, AlertCircle, Users, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskStore } from "@/hooks/use-task-store"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskCard } from "@/components/task-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskStatus, TaskType } from "@/lib/task-store"

export default function TasksPage() {
  const { tasks, activeUsers, getTaskStats } = useTaskStore()
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterType, setFilterType] = useState<TaskType | "all">("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")

  const stats = getTaskStats()

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterType !== "all" && task.type !== filterType) return false
    if (filterAssignee !== "all" && task.assignedTo !== filterAssignee) return false
    return true
  })

  // Group tasks by date for calendar view
  const tasksByDate = filteredTasks.reduce((acc, task) => {
    const date = new Date(task.dueDate).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(task)
    return acc
  }, {} as Record<string, typeof tasks>)

  // Get upcoming tasks (next 7 days)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const upcomingTasks = filteredTasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate >= today && dueDate <= nextWeek && task.status !== "completed"
  })

  // Get overdue tasks
  const overdueTasks = filteredTasks.filter((task) => {
    return new Date(task.dueDate) < today && task.status !== "completed"
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tasks & Calendar</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage farm tasks, vet visits, and daily operations
              </p>
            </div>
            <Button onClick={() => setIsAddTaskOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="h-5 w-5 text-blue-600" />
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
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
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
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={stats.overdue > 0 ? "border-red-500" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as TaskType | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="feeding">Feeding</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="vet-visit">Vet Visit</SelectItem>
                    <SelectItem value="breeding">Breeding</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
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
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {overdueTasks.length > 0 && (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Overdue Tasks ({overdueTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overdueTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Next 7 Days ({upcomingTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No upcoming tasks</p>
                ) : (
                  upcomingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tasks found</p>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-4">
              {Object.keys(tasksByDate)
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                .map((date) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        <Badge variant="outline" className="ml-auto">
                          {tasksByDate[date].length} task{tasksByDate[date].length !== 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tasksByDate[date].map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Task Dialog */}
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  )
}
