import { useState, useEffect } from "react"
import { taskStore, type Task, type FarmUser, type TaskStatus, type TaskType } from "@/lib/task-store"

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<FarmUser[]>([])

  useEffect(() => {
    const updateTasks = () => {
      setTasks(taskStore.getTasks())
      setUsers(taskStore.getUsers())
    }

    updateTasks()
    return taskStore.subscribe(updateTasks)
  }, [])

  return {
    tasks,
    users,
    activeUsers: users.filter((u) => u.active),
    getTasks: (filters?: {
      status?: TaskStatus
      type?: TaskType
      assignedTo?: string
      dateRange?: { start: string; end: string }
    }) => taskStore.getTasks(filters),
    getTask: (id: string) => taskStore.getTask(id),
    addTask: taskStore.addTask.bind(taskStore),
    updateTask: taskStore.updateTask.bind(taskStore),
    deleteTask: taskStore.deleteTask.bind(taskStore),
    getUser: (id: string) => taskStore.getUser(id),
    addUser: taskStore.addUser.bind(taskStore),
    updateUser: taskStore.updateUser.bind(taskStore),
    deleteUser: taskStore.deleteUser.bind(taskStore),
    getTaskStats: () => taskStore.getTaskStats(),
  }
}
