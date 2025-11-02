"use client"

import { useState } from "react"
import { Edit, Trash2, CheckCircle2, Clock, AlertCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "@/hooks/use-task-store"
import { useToast } from "@/hooks/use-toast"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import type { Task } from "@/lib/task-store"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask, getUser } = useTaskStore()
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const assignedUser = task.assignedTo ? getUser(task.assignedTo) : null
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed"

  const handleStatusChange = () => {
    const nextStatus =
      task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending"

    updateTask(task.id, { status: nextStatus })
    toast({
      title: "Status updated",
      description: `Task marked as ${nextStatus.replace("-", " ")}`,
    })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(task.id)
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      })
    }
  }

  const getPriorityColor = () => {
    switch (task.priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <>
      <div
        className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
          task.status === "completed" ? "bg-muted/30 opacity-75" : "bg-card hover:bg-accent/50"
        } ${isOverdue ? "border-red-500 border-2" : ""}`}
      >
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 mt-1" onClick={handleStatusChange}>
          {getStatusIcon()}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <h3 className={`font-semibold ${task.status === "completed" ? "line-through" : ""}`}>{task.title}</h3>
            <Badge variant="outline" className={`${getPriorityColor()} text-xs ml-auto flex-shrink-0`}>
              {task.priority}
            </Badge>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              📅 {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && <span className="text-red-600 font-semibold">(Overdue)</span>}
            </span>

            {assignedUser && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {assignedUser.name}
              </span>
            )}

            <Badge variant="secondary" className="text-xs">
              {task.type.replace("-", " ")}
            </Badge>

            <Badge
              variant={
                task.status === "completed"
                  ? "default"
                  : task.status === "in-progress"
                    ? "secondary"
                    : "outline"
              }
              className="text-xs"
            >
              {task.status.replace("-", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditTaskDialog task={task} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </>
  )
}
