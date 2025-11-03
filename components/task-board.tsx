"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { taskStore, type Task } from "@/lib/task-store"
import { CheckCircle2, Clock, AlertCircle, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const { toast } = useToast()

  const loadTasks = () => {
    setTasks(taskStore.getTasks())
  }

  useEffect(() => {
    loadTasks()
    const unsubscribe = taskStore.subscribe(loadTasks)
    return unsubscribe
  }, [])

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed"
    taskStore.updateTask(task.id, { status: newStatus })

    toast({
      title: newStatus === "completed" ? "Task Completed" : "Task Reopened",
      description: task.title,
    })
  }

  const handleUpdateStatus = (taskId: string, status: Task["status"]) => {
    taskStore.updateTask(taskId, { status })
    toast({
      title: "Status Updated",
      description: "Task status has been updated",
    })
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const renderTaskCard = (task: Task) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

    return (
      <Card key={task.id} className={`${isOverdue ? "border-red-500" : ""}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.status === "completed"}
                onCheckedChange={() => handleToggleStatus(task)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
              <Badge variant="outline">
                {task.type.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
              </Badge>
              {task.assignedTo && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignedTo}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>

              {task.status !== "completed" && (
                <div className="flex gap-1">
                  {task.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(task.id, "in-progress")}
                    >
                      Start
                    </Button>
                  )}
                  {task.status === "in-progress" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleUpdateStatus(task.id, "completed")}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              )}
            </div>

            {task.relatedEntity && (
              <div className="text-xs text-muted-foreground">
                Related: {task.relatedEntity.type} - {task.relatedEntity.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Pending Column */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending ({pendingTasks.length})
        </h3>
        <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No pending tasks
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map(renderTaskCard)
          )}
        </div>
      </div>

      {/* In Progress Column */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          In Progress ({inProgressTasks.length})
        </h3>
        <div className="space-y-3">
          {inProgressTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tasks in progress
              </CardContent>
            </Card>
          ) : (
            inProgressTasks.map(renderTaskCard)
          )}
        </div>
      </div>

      {/* Completed Column */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Completed ({completedTasks.length})
        </h3>
        <div className="space-y-3">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No completed tasks
              </CardContent>
            </Card>
          ) : (
            completedTasks.slice(0, 10).map(renderTaskCard)
          )}
        </div>
      </div>
    </div>
  )
}
