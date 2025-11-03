"use client"

import { useState } from "react"
import { Plus, CheckCircle2, Clock, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskBoard } from "@/components/task-board"
import { TimeTrackingPanel } from "@/components/time-tracking-panel"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { LogTimeDialog } from "@/components/log-time-dialog"
import { taskStore } from "@/lib/task-store"
import { timeTrackingStore } from "@/lib/time-tracking-store"

export default function TeamPage() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [logTimeOpen, setLogTimeOpen] = useState(false)

  const taskStats = taskStore.getTaskStats()
  const timeStats = timeTrackingStore.getTimeStats({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    end: new Date().toISOString(),
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Team Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tasks, time tracking, and team coordination
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  {taskStats.pending + taskStats.inProgress}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {taskStats.completed}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Hours (7 days)</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  {timeStats.totalHours.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Time Entries</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{timeStats.entryCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLogTimeOpen(true)}>
                <Clock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log Time</span>
              </Button>
              <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            </div>
          </div>

          <TabsContent value="tasks" className="space-y-4">
            <TaskBoard />
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <TimeTrackingPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
      <LogTimeDialog open={logTimeOpen} onOpenChange={setLogTimeOpen} />
    </div>
  )
}
