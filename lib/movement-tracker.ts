/**
 * Cattle Movement Tracker
 * Tracks all cattle movements for regulatory compliance
 */

import { generateUniqueId } from './id-generator'

export type MovementType =
  | 'arrival' // Animal arrives at farm
  | 'departure' // Animal leaves farm
  | 'pen-transfer' // Moved between pens on farm
  | 'barn-transfer' // Moved between barns
  | 'pasture-transfer' // Moved to/from pasture
  | 'sale' // Sold
  | 'death' // Died
  | 'quarantine' // Moved to quarantine
  | 'veterinary' // Moved for veterinary care

export interface CattleMovement {
  id: string
  cattleId: string
  cattleTagNumber: string
  movementType: MovementType
  fromLocation?: {
    type: 'pen' | 'barn' | 'pasture' | 'external'
    id?: string
    name: string
  }
  toLocation?: {
    type: 'pen' | 'barn' | 'pasture' | 'external'
    id?: string
    name: string
  }
  date: string
  time: string
  reason: string
  notes?: string
  weight?: number
  temperature?: number
  recordedBy: string
  // Regulatory fields
  transporterId?: string
  vehicleId?: string
  destination?: string
  accompanyingDocuments?: string[]
  verifiedBy?: string
  // Geolocation (for mobile)
  latitude?: number
  longitude?: number
  // Offline sync
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface MovementReport {
  startDate: string
  endDate: string
  movements: CattleMovement[]
  summary: {
    totalMovements: number
    arrivals: number
    departures: number
    onFarmTransfers: number
    sales: number
    deaths: number
  }
}

class MovementTracker {
  // Record a movement
  recordMovement(
    cattleId: string,
    cattleTagNumber: string,
    movementType: MovementType,
    fromLocation: CattleMovement['fromLocation'],
    toLocation: CattleMovement['toLocation'],
    reason: string,
    options: {
      notes?: string
      weight?: number
      temperature?: number
      recordedBy?: string
      transporterId?: string
      vehicleId?: string
      destination?: string
      latitude?: number
      longitude?: number
    } = {}
  ): CattleMovement {
    const now = new Date()
    const movement: CattleMovement = {
      id: `movement-${Date.now()}-${generateUniqueId()}`,
      cattleId,
      cattleTagNumber,
      movementType,
      fromLocation,
      toLocation,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      reason,
      notes: options.notes,
      weight: options.weight,
      temperature: options.temperature,
      recordedBy: options.recordedBy || 'System',
      transporterId: options.transporterId,
      vehicleId: options.vehicleId,
      destination: options.destination,
      latitude: options.latitude,
      longitude: options.longitude,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      syncStatus: 'pending'
    }

    return movement
  }

  // Generate regulatory report
  generateReport(movements: CattleMovement[], startDate: string, endDate: string): MovementReport {
    const filtered = movements.filter(m => {
      const movementDate = new Date(m.date)
      return movementDate >= new Date(startDate) && movementDate <= new Date(endDate)
    })

    const summary = {
      totalMovements: filtered.length,
      arrivals: filtered.filter(m => m.movementType === 'arrival').length,
      departures: filtered.filter(m => m.movementType === 'departure').length,
      onFarmTransfers: filtered.filter(m =>
        ['pen-transfer', 'barn-transfer', 'pasture-transfer'].includes(m.movementType)
      ).length,
      sales: filtered.filter(m => m.movementType === 'sale').length,
      deaths: filtered.filter(m => m.movementType === 'death').length
    }

    return {
      startDate,
      endDate,
      movements: filtered,
      summary
    }
  }

  // Export to CSV for regulatory submission
  exportToCSV(movements: CattleMovement[]): string {
    const headers = [
      'Date',
      'Time',
      'Tag Number',
      'Movement Type',
      'From Location',
      'To Location',
      'Reason',
      'Weight (lbs)',
      'Temperature (°F)',
      'Recorded By',
      'Transporter ID',
      'Vehicle ID',
      'Destination',
      'Notes'
    ]

    const rows = movements.map(m => [
      m.date,
      m.time,
      m.cattleTagNumber,
      m.movementType,
      m.fromLocation?.name || 'N/A',
      m.toLocation?.name || 'N/A',
      m.reason,
      m.weight?.toString() || 'N/A',
      m.temperature?.toString() || 'N/A',
      m.recordedBy,
      m.transporterId || 'N/A',
      m.vehicleId || 'N/A',
      m.destination || 'N/A',
      m.notes || 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return csv
  }

  // Validate movement for regulatory compliance
  validateMovement(movement: CattleMovement): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!movement.cattleTagNumber) {
      errors.push('Tag number is required')
    }

    if (!movement.date) {
      errors.push('Date is required')
    }

    if (!movement.movementType) {
      errors.push('Movement type is required')
    }

    if (['arrival', 'departure', 'sale'].includes(movement.movementType)) {
      if (!movement.fromLocation && !movement.toLocation) {
        errors.push('Either from or to location is required for this movement type')
      }
    }

    if (movement.movementType === 'departure' && !movement.destination) {
      errors.push('Destination is required for departures')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const movementTracker = new MovementTracker()
