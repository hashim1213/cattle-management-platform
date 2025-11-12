/**
 * Task Management Store
 * Handles farm tasks, calendar events, vet visits, etc.
 */
import { generateUniqueId } from "./id-generator"

export type TaskType = "general" | "feeding" | "health" | "vet-visit" | "breeding" | "maintenance" | "other"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "pending" | "in-progress" | "completed" | "cancelled"

export interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  assignedTo?: string // User ID or name
  cattleId?: string // Optional link to specific cattle
  penId?: string // Optional link to pen
  barnId?: string // Optional link to barn
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface FarmUser {
  id: string
  name: string
  role: "owner" | "manager" | "farmhand" | "veterinarian"
  email?: string
  phone?: string
  active: boolean
  createdAt: string
}

const TASKS_STORAGE_KEY = "cattle-tasks"
const USERS_STORAGE_KEY = "farm-users"

// Start with empty data - users and tasks should be created through the application
const DEFAULT_USERS: FarmUser[] = []
const DEFAULT_TASKS: Task[] = []

class TaskStore {
  private tasks: Task[] = []
  private users: FarmUser[] = []
  private listeners = new Set<() => void>()

  constructor() {
    if (typeof window !== "undefined") {
      this.load()
    }
  }

  private load() {
    try {
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)

      this.tasks = storedTasks ? JSON.parse(storedTasks) : DEFAULT_TASKS
      this.users = storedUsers ? JSON.parse(storedUsers) : DEFAULT_USERS

      if (!storedTasks) this.save()
      if (!storedUsers) this.save()
    } catch (error) {
      console.error("Failed to load task data:", error)
      this.tasks = DEFAULT_TASKS
      this.users = DEFAULT_USERS
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks))
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users))
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save task data:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Task operations
  getTasks(filters?: {
    status?: TaskStatus
    type?: TaskType
    assignedTo?: string
    dateRange?: { start: string; end: string }
  }): Task[] {
    let filtered = [...this.tasks]

    if (filters) {
      if (filters.status) {
        filtered = filtered.filter((t) => t.status === filters.status)
      }
      if (filters.type) {
        filtered = filtered.filter((t) => t.type === filters.type)
      }
      if (filters.assignedTo) {
        filtered = filtered.filter((t) => t.assignedTo === filters.assignedTo)
      }
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)
        filtered = filtered.filter((t) => {
          const dueDate = new Date(t.dueDate)
          return dueDate >= start && dueDate <= end
        })
      }
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id)
  }

  addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const newTask: Task = {
      ...task,
      id: generateUniqueId("task"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.tasks.push(newTask)
    this.save()
    return newTask
  }

  updateTask(id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): boolean {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return false

    // If marking as completed, set completedAt
    if (updates.status === "completed" && this.tasks[index].status !== "completed") {
      updates.completedAt = new Date().toISOString()
    }

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    this.save()
    return true
  }

  // User operations
  getUsers(): FarmUser[] {
    return [...this.users]
  }

  getActiveUsers(): FarmUser[] {
    return this.users.filter((u) => u.active)
  }

  getUser(id: string): FarmUser | undefined {
    return this.users.find((u) => u.id === id)
  }

  addUser(user: Omit<FarmUser, "id" | "createdAt">): FarmUser {
    const newUser: FarmUser = {
      ...user,
      id: generateUniqueId("user"),
      createdAt: new Date().toISOString(),
    }

    this.users.push(newUser)
    this.save()
    return newUser
  }

  updateUser(id: string, updates: Partial<Omit<FarmUser, "id" | "createdAt">>): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false

    this.users[index] = {
      ...this.users[index],
      ...updates,
    }

    this.save()
    return true
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false

    this.users.splice(index, 1)
    this.save()
    return true
  }

  // Analytics
  getTaskStats() {
    const total = this.tasks.length
    const pending = this.tasks.filter((t) => t.status === "pending").length
    const inProgress = this.tasks.filter((t) => t.status === "in-progress").length
    const completed = this.tasks.filter((t) => t.status === "completed").length
    const overdue = this.tasks.filter(
      (t) => t.status !== "completed" && new Date(t.dueDate) < new Date()
    ).length

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    }
  }
}

export const taskStore = new TaskStore()
