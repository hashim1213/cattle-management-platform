/**
 * Enhanced Health Management System
 * Vaccination tracking, treatment protocols, disease alerts, vet appointments
 */

export interface Vaccination {
  id: string
  cattleId: string
  vaccineType: string
  vaccineName: string
  administeredDate: string
  nextDueDate?: string
  batchNumber?: string
  administeredBy: string
  notes?: string
  createdAt: string
}

export interface TreatmentProtocol {
  id: string
  name: string
  disease: string
  description: string
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DiseaseAlert {
  id: string
  disease: string
  severity: "low" | "medium" | "high" | "critical"
  affectedCattleIds: string[]
  reportedDate: string
  status: "active" | "contained" | "resolved"
  notes?: string
  actions: string[]
  resolvedDate?: string
  createdAt: string
}

export interface VetAppointment {
  id: string
  title: string
  description?: string
  appointmentDate: string
  veterinarianName: string
  veterinarianContact?: string
  cattleIds: string[]
  purpose: "routine_check" | "vaccination" | "treatment" | "surgery" | "emergency" | "other"
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  cost?: number
  createdAt: string
  completedAt?: string
}

const VACCINATIONS_KEY = "health_vaccinations"
const PROTOCOLS_KEY = "health_protocols"
const ALERTS_KEY = "health_disease_alerts"
const APPOINTMENTS_KEY = "health_vet_appointments"

class HealthEnhancedStore {
  private vaccinations: Vaccination[] = []
  private protocols: TreatmentProtocol[] = []
  private alerts: DiseaseAlert[] = []
  private appointments: VetAppointment[] = []
  private listeners: Array<() => void> = []

  constructor() {
    this.loadAll()
  }

  private loadAll() {
    // Removed localStorage caching for realtime data loading
    this.vaccinations = []
    this.protocols = []
    this.alerts = []
    this.appointments = []
  }

  private saveAll() {
    // Removed localStorage caching for realtime data loading
    this.notifyListeners()
  }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  // Vaccination Management
  getVaccinations(): Vaccination[] {
    return this.vaccinations
  }

  getVaccinationsByCattle(cattleId: string): Vaccination[] {
    return this.vaccinations.filter((v) => v.cattleId === cattleId)
  }

  addVaccination(vaccination: Omit<Vaccination, "id" | "createdAt">): string {
    const newVaccination: Vaccination = {
      ...vaccination,
      id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.vaccinations.push(newVaccination)
    this.saveAll()
    return newVaccination.id
  }

  updateVaccination(id: string, updates: Partial<Vaccination>) {
    const index = this.vaccinations.findIndex((v) => v.id === id)
    if (index !== -1) {
      this.vaccinations[index] = { ...this.vaccinations[index], ...updates }
      this.saveAll()
    }
  }

  deleteVaccination(id: string) {
    this.vaccinations = this.vaccinations.filter((v) => v.id !== id)
    this.saveAll()
  }

  // Treatment Protocols
  getProtocols(): TreatmentProtocol[] {
    return this.protocols
  }

  getActiveProtocols(): TreatmentProtocol[] {
    return this.protocols.filter((p) => p.isActive)
  }

  addProtocol(protocol: Omit<TreatmentProtocol, "id" | "createdAt" | "updatedAt">): string {
    const now = new Date().toISOString()
    const newProtocol: TreatmentProtocol = {
      ...protocol,
      id: `proto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }

    this.protocols.push(newProtocol)
    this.saveAll()
    return newProtocol.id
  }

  updateProtocol(id: string, updates: Partial<TreatmentProtocol>) {
    const index = this.protocols.findIndex((p) => p.id === id)
    if (index !== -1) {
      this.protocols[index] = {
        ...this.protocols[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      this.saveAll()
    }
  }

  deleteProtocol(id: string) {
    this.protocols = this.protocols.filter((p) => p.id !== id)
    this.saveAll()
  }

  // Disease Alerts
  getAlerts(): DiseaseAlert[] {
    return this.alerts
  }

  getActiveAlerts(): DiseaseAlert[] {
    return this.alerts.filter((a) => a.status === "active")
  }

  getCriticalAlerts(): DiseaseAlert[] {
    return this.alerts.filter((a) => a.status === "active" && a.severity === "critical")
  }

  addAlert(alert: Omit<DiseaseAlert, "id" | "createdAt">): string {
    const newAlert: DiseaseAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.alerts.unshift(newAlert) // Add to beginning for recent display
    this.saveAll()
    return newAlert.id
  }

  updateAlert(id: string, updates: Partial<DiseaseAlert>) {
    const index = this.alerts.findIndex((a) => a.id === id)
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates }
      this.saveAll()
    }
  }

  resolveAlert(id: string, notes?: string) {
    this.updateAlert(id, {
      status: "resolved",
      resolvedDate: new Date().toISOString(),
      notes,
    })
  }

  deleteAlert(id: string) {
    this.alerts = this.alerts.filter((a) => a.id !== id)
    this.saveAll()
  }

  // Vet Appointments
  getAppointments(): VetAppointment[] {
    return this.appointments
  }

  getUpcomingAppointments(): VetAppointment[] {
    const now = new Date()
    return this.appointments
      .filter((a) => a.status === "scheduled" && new Date(a.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
  }

  addAppointment(appointment: Omit<VetAppointment, "id" | "createdAt">): string {
    const newAppointment: VetAppointment = {
      ...appointment,
      id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.appointments.push(newAppointment)
    this.saveAll()
    return newAppointment.id
  }

  updateAppointment(id: string, updates: Partial<VetAppointment>) {
    const index = this.appointments.findIndex((a) => a.id === id)
    if (index !== -1) {
      this.appointments[index] = { ...this.appointments[index], ...updates }
      this.saveAll()
    }
  }

  completeAppointment(id: string, notes?: string, cost?: number) {
    this.updateAppointment(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      notes,
      cost,
    })
  }

  cancelAppointment(id: string, notes?: string) {
    this.updateAppointment(id, {
      status: "cancelled",
      notes,
    })
  }

  deleteAppointment(id: string) {
    this.appointments = this.appointments.filter((a) => a.id !== id)
    this.saveAll()
  }

  // Statistics
  getVaccinationStats() {
    const total = this.vaccinations.length
    const last30Days = this.vaccinations.filter((v) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(v.administeredDate) >= thirtyDaysAgo
    }).length

    const upcomingDue = this.vaccinations.filter((v) => {
      if (!v.nextDueDate) return false
      const dueDate = new Date(v.nextDueDate)
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      return dueDate >= today && dueDate <= thirtyDaysFromNow
    }).length

    return { total, last30Days, upcomingDue }
  }
}

export const healthEnhancedStore = new HealthEnhancedStore()
