/**
 * Standardized Health Records Module
 * Structured data capture for health events, eliminating unreliable note-taking
 */

import { generateUniqueId } from './id-generator'

export type HealthEventType =
  | 'vaccination'
  | 'antibiotic-treatment'
  | 'illness'
  | 'injury'
  | 'temperature-check'
  | 'routine-checkup'
  | 'surgery'
  | 'deworming'
  | 'other-treatment'

export type AntibioticType =
  | 'Penicillin'
  | 'Tylosin'
  | 'Oxytetracycline'
  | 'Florfenicol'
  | 'Ceftiofur'
  | 'Tulathromycin'
  | 'Other'

export type VaccineType =
  | 'IBR-BVD'
  | 'Clostridial'
  | 'Pinkeye'
  | 'Scours'
  | 'Respiratory'
  | 'Brucellosis'
  | 'Other'

export interface HealthRecord {
  id: string
  cattleId: string
  cattleTagNumber: string
  date: string
  time: string
  eventType: HealthEventType

  // Temperature data
  temperature?: {
    value: number
    unit: 'F' | 'C'
    method: 'rectal' | 'ear' | 'infrared'
  }

  // Vaccination data
  vaccination?: {
    type: VaccineType
    name: string
    manufacturer?: string
    lotNumber?: string
    dose: string
    route: 'IM' | 'SQ' | 'IV' | 'Oral' | 'Intranasal'
    site: string
    boosterDue?: string
  }

  // Antibiotic treatment
  antibioticTreatment?: {
    type: AntibioticType
    name: string
    dosage: string
    dosageUnit: 'mg' | 'ml' | 'cc'
    route: 'IM' | 'SQ' | 'IV' | 'Oral'
    frequency: string
    duration: string
    withdrawalPeriod: number // days
    withdrawalDate: string
    lotNumber?: string
  }

  // Illness/symptoms
  illness?: {
    primarySymptoms: string[]
    severity: 'mild' | 'moderate' | 'severe'
    diagnosis?: string
    differentialDiagnosis?: string[]
  }

  // Treatment details
  treatment?: {
    description: string
    medications: string[]
    procedures: string[]
  }

  // Clinical observations
  observations: {
    bodyConditionScore?: number // 1-9 scale
    respiratoryRate?: number
    heartRate?: number
    rumination?: 'normal' | 'reduced' | 'absent'
    appetite?: 'normal' | 'reduced' | 'absent'
    hydrationStatus?: 'normal' | 'mild-dehydration' | 'moderate-dehydration' | 'severe-dehydration'
    attitude?: 'alert' | 'depressed' | 'down'
    manure?: 'normal' | 'loose' | 'watery' | 'constipated' | 'bloody'
  }

  // Veterinarian info
  veterinarian?: {
    name: string
    license?: string
    clinic?: string
    phone?: string
  }

  // Follow-up
  followUp?: {
    required: boolean
    date?: string
    notes?: string
  }

  // Cost
  cost?: number

  // Voice note attachment
  voiceNoteId?: string

  // Photos
  photoIds?: string[]

  // Recorded by
  recordedBy: string

  // Notes (optional, structured data is preferred)
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface TreatmentProtocol {
  id: string
  name: string
  condition: string
  steps: {
    day: number
    medication: string
    dosage: string
    route: string
    notes?: string
  }[]
}

class HealthRecordManager {
  // Create a standardized health record
  createHealthRecord(
    cattleId: string,
    cattleTagNumber: string,
    eventType: HealthEventType,
    recordedBy: string
  ): HealthRecord {
    const now = new Date()
    return {
      id: `health-${Date.now()}-${generateUniqueId()}`,
      cattleId,
      cattleTagNumber,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      eventType,
      observations: {},
      recordedBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      syncStatus: 'pending'
    }
  }

  // Add temperature reading
  addTemperature(
    record: HealthRecord,
    value: number,
    unit: 'F' | 'C' = 'F',
    method: 'rectal' | 'ear' | 'infrared' = 'rectal'
  ): HealthRecord {
    return {
      ...record,
      temperature: { value, unit, method },
      updatedAt: new Date().toISOString()
    }
  }

  // Add vaccination
  addVaccination(
    record: HealthRecord,
    type: VaccineType,
    name: string,
    dose: string,
    route: 'IM' | 'SQ' | 'IV' | 'Oral' | 'Intranasal',
    site: string,
    options: {
      manufacturer?: string
      lotNumber?: string
      boosterDue?: string
    } = {}
  ): HealthRecord {
    return {
      ...record,
      vaccination: {
        type,
        name,
        dose,
        route,
        site,
        manufacturer: options.manufacturer,
        lotNumber: options.lotNumber,
        boosterDue: options.boosterDue
      },
      updatedAt: new Date().toISOString()
    }
  }

  // Add antibiotic treatment with automatic withdrawal calculation
  addAntibioticTreatment(
    record: HealthRecord,
    type: AntibioticType,
    name: string,
    dosage: string,
    dosageUnit: 'mg' | 'ml' | 'cc',
    route: 'IM' | 'SQ' | 'IV' | 'Oral',
    frequency: string,
    duration: string,
    withdrawalPeriod: number,
    options: {
      lotNumber?: string
    } = {}
  ): HealthRecord {
    const withdrawalDate = new Date()
    withdrawalDate.setDate(withdrawalDate.getDate() + withdrawalPeriod)

    return {
      ...record,
      antibioticTreatment: {
        type,
        name,
        dosage,
        dosageUnit,
        route,
        frequency,
        duration,
        withdrawalPeriod,
        withdrawalDate: withdrawalDate.toISOString().split('T')[0],
        lotNumber: options.lotNumber
      },
      updatedAt: new Date().toISOString()
    }
  }

  // Check if cattle is within withdrawal period
  isInWithdrawalPeriod(records: HealthRecord[], cattleId: string): {
    inWithdrawal: boolean
    withdrawalDate?: string
    treatment?: string
  } {
    const now = new Date()
    const cattleRecords = records.filter(r => r.cattleId === cattleId)

    for (const record of cattleRecords) {
      if (record.antibioticTreatment) {
        const withdrawalDate = new Date(record.antibioticTreatment.withdrawalDate)
        if (withdrawalDate > now) {
          return {
            inWithdrawal: true,
            withdrawalDate: record.antibioticTreatment.withdrawalDate,
            treatment: record.antibioticTreatment.name
          }
        }
      }
    }

    return { inWithdrawal: false }
  }

  // Get treatment history for an animal
  getTreatmentHistory(records: HealthRecord[], cattleId: string): HealthRecord[] {
    return records
      .filter(r => r.cattleId === cattleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Validate health record completeness
  validateRecord(record: HealthRecord): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    if (!record.cattleTagNumber) {
      warnings.push('Cattle tag number is required')
    }

    if (!record.date) {
      warnings.push('Date is required')
    }

    if (record.eventType === 'vaccination' && !record.vaccination) {
      warnings.push('Vaccination details are required for vaccination events')
    }

    if (record.eventType === 'antibiotic-treatment' && !record.antibioticTreatment) {
      warnings.push('Antibiotic treatment details are required')
    }

    if (record.antibioticTreatment && !record.antibioticTreatment.lotNumber) {
      warnings.push('Lot number is recommended for antibiotics')
    }

    if (record.eventType === 'temperature-check' && !record.temperature) {
      warnings.push('Temperature reading is required for temperature check events')
    }

    return {
      valid: warnings.length === 0,
      warnings
    }
  }

  // Export health records to CSV
  exportToCSV(records: HealthRecord[]): string {
    const headers = [
      'Date',
      'Time',
      'Tag Number',
      'Event Type',
      'Temperature',
      'Vaccine',
      'Antibiotic',
      'Dosage',
      'Withdrawal Date',
      'Symptoms',
      'Veterinarian',
      'Recorded By',
      'Cost'
    ]

    const rows = records.map(r => [
      r.date,
      r.time,
      r.cattleTagNumber,
      r.eventType,
      r.temperature ? `${r.temperature.value}°${r.temperature.unit}` : 'N/A',
      r.vaccination?.name || 'N/A',
      r.antibioticTreatment?.name || 'N/A',
      r.antibioticTreatment ? `${r.antibioticTreatment.dosage}${r.antibioticTreatment.dosageUnit}` : 'N/A',
      r.antibioticTreatment?.withdrawalDate || 'N/A',
      r.illness?.primarySymptoms?.join('; ') || 'N/A',
      r.veterinarian?.name || 'N/A',
      r.recordedBy,
      r.cost?.toString() || 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return csv
  }
}

export const healthRecordManager = new HealthRecordManager()
