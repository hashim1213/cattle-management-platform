import { useEffect, useState } from "react"
import {
  healthEnhancedStore,
  type Vaccination,
  type TreatmentProtocol,
  type DiseaseAlert,
  type VetAppointment,
} from "@/lib/health-enhanced-store"

export function useHealthEnhanced() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>([])
  const [alerts, setAlerts] = useState<DiseaseAlert[]>([])
  const [appointments, setAppointments] = useState<VetAppointment[]>([])

  useEffect(() => {
    const updateState = () => {
      setVaccinations(healthEnhancedStore.getVaccinations())
      setProtocols(healthEnhancedStore.getProtocols())
      setAlerts(healthEnhancedStore.getAlerts())
      setAppointments(healthEnhancedStore.getAppointments())
    }

    updateState()
    const unsubscribe = healthEnhancedStore.subscribe(updateState)

    return () => unsubscribe()
  }, [])

  return {
    // Vaccinations
    vaccinations,
    getVaccinationsByCattle: (cattleId: string) =>
      healthEnhancedStore.getVaccinationsByCattle(cattleId),
    addVaccination: (vaccination: Omit<Vaccination, "id" | "createdAt">) =>
      healthEnhancedStore.addVaccination(vaccination),
    updateVaccination: (id: string, updates: Partial<Vaccination>) =>
      healthEnhancedStore.updateVaccination(id, updates),
    deleteVaccination: (id: string) => healthEnhancedStore.deleteVaccination(id),

    // Treatment Protocols
    protocols,
    activeProtocols: protocols.filter((p) => p.isActive),
    addProtocol: (protocol: Omit<TreatmentProtocol, "id" | "createdAt" | "updatedAt">) =>
      healthEnhancedStore.addProtocol(protocol),
    updateProtocol: (id: string, updates: Partial<TreatmentProtocol>) =>
      healthEnhancedStore.updateProtocol(id, updates),
    deleteProtocol: (id: string) => healthEnhancedStore.deleteProtocol(id),

    // Disease Alerts
    alerts,
    activeAlerts: alerts.filter((a) => a.status === "active"),
    criticalAlerts: alerts.filter((a) => a.status === "active" && a.severity === "critical"),
    addAlert: (alert: Omit<DiseaseAlert, "id" | "createdAt">) =>
      healthEnhancedStore.addAlert(alert),
    updateAlert: (id: string, updates: Partial<DiseaseAlert>) =>
      healthEnhancedStore.updateAlert(id, updates),
    resolveAlert: (id: string, notes?: string) => healthEnhancedStore.resolveAlert(id, notes),
    deleteAlert: (id: string) => healthEnhancedStore.deleteAlert(id),

    // Vet Appointments
    appointments,
    upcomingAppointments: healthEnhancedStore.getUpcomingAppointments(),
    addAppointment: (appointment: Omit<VetAppointment, "id" | "createdAt">) =>
      healthEnhancedStore.addAppointment(appointment),
    updateAppointment: (id: string, updates: Partial<VetAppointment>) =>
      healthEnhancedStore.updateAppointment(id, updates),
    completeAppointment: (id: string, notes?: string, cost?: number) =>
      healthEnhancedStore.completeAppointment(id, notes, cost),
    cancelAppointment: (id: string, notes?: string) =>
      healthEnhancedStore.cancelAppointment(id, notes),
    deleteAppointment: (id: string) => healthEnhancedStore.deleteAppointment(id),

    // Statistics
    vaccinationStats: healthEnhancedStore.getVaccinationStats(),
  }
}
