/**
 * User Roles and Permissions Store
 * Multi-level access control for team members vs administrators
 */
import { generateUniqueId } from "./id-generator"

export type UserRole = "owner" | "manager" | "team-member" | "veterinarian" | "viewer"

export interface Permission {
  viewCattle: boolean
  editCattle: boolean
  deleteCattle: boolean
  viewFinancial: boolean
  editFinancial: boolean
  viewPens: boolean
  editPens: boolean
  viewTasks: boolean
  editTasks: boolean
  assignTasks: boolean
  viewReports: boolean
  exportData: boolean
  manageUsers: boolean
  viewTimeTracking: boolean
  editTimeTracking: boolean
  manageBatches: boolean
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  permissions: Permission
  active: boolean
  pin?: string // Simple PIN for quick mobile login
  createdAt: string
  updatedAt: string
}

const USERS_STORAGE_KEY = "cattle-users"
const CURRENT_USER_KEY = "cattle-current-user"

// Default permission sets by role
const rolePermissions: Record<UserRole, Permission> = {
  owner: {
    viewCattle: true,
    editCattle: true,
    deleteCattle: true,
    viewFinancial: true,
    editFinancial: true,
    viewPens: true,
    editPens: true,
    viewTasks: true,
    editTasks: true,
    assignTasks: true,
    viewReports: true,
    exportData: true,
    manageUsers: true,
    viewTimeTracking: true,
    editTimeTracking: true,
    manageBatches: true,
  },
  manager: {
    viewCattle: true,
    editCattle: true,
    deleteCattle: false,
    viewFinancial: true,
    editFinancial: false,
    viewPens: true,
    editPens: true,
    viewTasks: true,
    editTasks: true,
    assignTasks: true,
    viewReports: true,
    exportData: true,
    manageUsers: false,
    viewTimeTracking: true,
    editTimeTracking: true,
    manageBatches: true,
  },
  "team-member": {
    viewCattle: true,
    editCattle: false,
    deleteCattle: false,
    viewFinancial: false,
    editFinancial: false,
    viewPens: true,
    editPens: false,
    viewTasks: true,
    editTasks: true, // Can update assigned tasks
    assignTasks: false,
    viewReports: false,
    exportData: false,
    manageUsers: false,
    viewTimeTracking: true,
    editTimeTracking: true, // Can log their own time
    manageBatches: false,
  },
  veterinarian: {
    viewCattle: true,
    editCattle: true, // Health records only
    deleteCattle: false,
    viewFinancial: false,
    editFinancial: false,
    viewPens: true,
    editPens: false,
    viewTasks: true,
    editTasks: true,
    assignTasks: false,
    viewReports: true,
    exportData: false,
    manageUsers: false,
    viewTimeTracking: false,
    editTimeTracking: false,
    manageBatches: false,
  },
  viewer: {
    viewCattle: true,
    editCattle: false,
    deleteCattle: false,
    viewFinancial: false,
    editFinancial: false,
    viewPens: true,
    editPens: false,
    viewTasks: true,
    editTasks: false,
    assignTasks: false,
    viewReports: true,
    exportData: false,
    manageUsers: false,
    viewTimeTracking: false,
    editTimeTracking: false,
    manageBatches: false,
  },
}

// No default users - start empty for production
class UserRolesStore {
  private users: User[] = []
  private currentUserId: string | null = null
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadData()
  }

  private loadData() {
    if (typeof window === "undefined") return

    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
      const storedCurrentUser = localStorage.getItem(CURRENT_USER_KEY)

      this.users = storedUsers ? JSON.parse(storedUsers) : []
      this.currentUserId = storedCurrentUser || null

      if (!storedUsers) {
        this.save()
      }
    } catch (error) {
      this.users = []
      this.currentUserId = null
    }
  }

  private save() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users))
      if (this.currentUserId) {
        localStorage.setItem(CURRENT_USER_KEY, this.currentUserId)
      }
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to save user data:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // User operations
  getUsers(): User[] {
    return [...this.users]
  }

  getActiveUsers(): User[] {
    return this.users.filter((u) => u.active)
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id)
  }

  getCurrentUser(): User | null {
    if (!this.currentUserId) return null
    return this.getUser(this.currentUserId) || null
  }

  setCurrentUser(userId: string): boolean {
    const user = this.getUser(userId)
    if (!user || !user.active) return false

    this.currentUserId = userId
    this.save()
    return true
  }

  addUser(userData: Omit<User, "id" | "permissions" | "createdAt" | "updatedAt">): string {
    const newUser: User = {
      ...userData,
      id: generateUniqueId("user"),
      permissions: rolePermissions[userData.role],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.users.push(newUser)
    this.save()
    return newUser.id
  }

  updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt">>): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false

    // If role changed, update permissions
    if (updates.role && updates.role !== this.users[index].role) {
      updates.permissions = rolePermissions[updates.role]
    }

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteUser(id: string): boolean {
    // Can't delete owner
    const user = this.getUser(id)
    if (!user || user.role === "owner") return false

    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false

    this.users.splice(index, 1)
    this.save()
    return true
  }

  // Authentication
  loginWithPin(pin: string): User | null {
    const user = this.users.find((u) => u.pin === pin && u.active)
    if (user) {
      this.currentUserId = user.id
      this.save()
      return user
    }
    return null
  }

  // Permissions check
  checkPermission(permission: keyof Permission): boolean {
    const currentUser = this.getCurrentUser()
    if (!currentUser) return false
    return currentUser.permissions[permission]
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.getCurrentUser()
    if (!currentUser) return false
    return currentUser.role === role
  }

  isOwnerOrManager(): boolean {
    const currentUser = this.getCurrentUser()
    if (!currentUser) return false
    return currentUser.role === "owner" || currentUser.role === "manager"
  }
}

export const userRolesStore = new UserRolesStore()
