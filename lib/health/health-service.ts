// Health Service - Integrates health records with automatic inventory deductions

import {
  HealthRecord,
  HealthEventType,
  AntibioticType,
  VaccineType,
  healthRecordManager
} from "../health-records"
import { inventoryService } from "../inventory/inventory-service"
import { InventoryTransaction } from "../inventory/inventory-types"

interface RecordTreatmentParams {
  cattleId: string
  cattleTagNumber: string
  drugName: string
  drugInventoryId: string
  dosageAmount: number
  dosageUnit: "cc" | "ml" | "doses"
  administrationRoute: "IM" | "SQ" | "IV" | "Oral" | "Intranasal"
  withdrawalPeriod?: number
  cattleWeight?: number
  notes?: string
  recordedBy: string
  eventType?: HealthEventType
}

interface RecordVaccinationParams {
  cattleId: string
  cattleTagNumber: string
  vaccineName: string
  vaccineInventoryId: string
  vaccineType: VaccineType
  dose: string
  route: "IM" | "SQ" | "IV" | "Oral" | "Intranasal"
  site: string
  boosterDue?: string
  manufacturer?: string
  lotNumber?: string
  recordedBy: string
}

interface TreatmentResult {
  healthRecord: HealthRecord
  inventoryTransaction: InventoryTransaction
  withdrawalDate?: string
}

/**
 * Health Service - Bridges health records and inventory management
 *
 * KEY PRINCIPLE: Every treatment MUST deduct from inventory
 * This ensures 100% accuracy in drug tracking and usage
 */
class HealthService {
  private static instance: HealthService
  private healthRecords: HealthRecord[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService()
    }
    return HealthService.instance
  }

  private load() {
    if (typeof window === "undefined") return

    const recordsData = localStorage.getItem("healthRecords")
    if (recordsData) {
      this.healthRecords = JSON.parse(recordsData)
    }
  }

  private save() {
    if (typeof window === "undefined") return
    localStorage.setItem("healthRecords", JSON.stringify(this.healthRecords))
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  /**
   * Record a treatment with automatic inventory deduction
   * This is the ATOMIC operation that ensures data consistency
   *
   * Steps:
   * 1. Check inventory availability
   * 2. Create health record
   * 3. Deduct from inventory
   * 4. Link records together
   * 5. Save all changes
   */
  async recordTreatment(params: RecordTreatmentParams): Promise<TreatmentResult> {
    // 1. Check if drug is available in inventory
    const availability = await inventoryService.checkAvailability(
      params.drugInventoryId,
      params.dosageAmount
    )

    if (!availability.available) {
      throw new Error(
        `Insufficient inventory: ${availability.itemName} - ` +
        `Need ${availability.requiredQuantity}${availability.unit}, ` +
        `have ${availability.currentQuantity}${availability.unit} ` +
        `(short ${availability.shortfall}${availability.unit})`
      )
    }

    // 2. Create health record
    const record = healthRecordManager.createHealthRecord(
      params.cattleId,
      params.cattleTagNumber,
      params.eventType || "antibiotic-treatment",
      params.recordedBy
    )

    // 3. Add treatment details based on event type
    let enrichedRecord: HealthRecord

    if (params.eventType === "vaccination") {
      enrichedRecord = healthRecordManager.addVaccination(
        record,
        "Other" as VaccineType,
        params.drugName,
        `${params.dosageAmount}${params.dosageUnit}`,
        params.administrationRoute,
        "Standard site"
      )
    } else {
      // Antibiotic or other drug treatment
      const withdrawalPeriod = params.withdrawalPeriod || 0
      enrichedRecord = healthRecordManager.addAntibioticTreatment(
        record,
        "Other" as AntibioticType,
        params.drugName,
        params.dosageAmount.toString(),
        params.dosageUnit === "doses" ? "cc" : params.dosageUnit,
        params.administrationRoute,
        "Once",
        "Single dose",
        withdrawalPeriod
      )
    }

    // Add cost and notes
    const inventoryItem = inventoryService.getItem(params.drugInventoryId)
    enrichedRecord.cost = inventoryItem ? inventoryItem.costPerUnit * params.dosageAmount : 0
    enrichedRecord.notes = params.notes

    // 4. Deduct from inventory (ATOMIC)
    let transaction: InventoryTransaction
    try {
      transaction = await inventoryService.deduct({
        itemId: params.drugInventoryId,
        quantity: params.dosageAmount,
        reason: `Treatment for cattle ${params.cattleTagNumber}`,
        performedBy: params.recordedBy,
        relatedRecordType: "health_record",
        relatedRecordId: enrichedRecord.id,
        notes: params.notes
      })
    } catch (error) {
      // If inventory deduction fails, don't create health record
      throw new Error(`Inventory deduction failed: ${(error as Error).message}`)
    }

    // 5. Save health record
    this.healthRecords.push(enrichedRecord)
    this.save()

    return {
      healthRecord: enrichedRecord,
      inventoryTransaction: transaction,
      withdrawalDate: enrichedRecord.antibioticTreatment?.withdrawalDate
    }
  }

  /**
   * Record vaccination with automatic inventory deduction
   */
  async recordVaccination(params: RecordVaccinationParams): Promise<TreatmentResult> {
    // Parse dose to extract numeric quantity
    const doseMatch = params.dose.match(/(\d+(?:\.\d+)?)\s*(cc|ml|doses?)?/)
    if (!doseMatch) {
      throw new Error(`Invalid dose format: ${params.dose}. Use format like "5cc" or "2ml"`)
    }

    const dosageAmount = parseFloat(doseMatch[1])
    const dosageUnit = (doseMatch[2] || "cc") as "cc" | "ml" | "doses"

    // 1. Check inventory availability
    const availability = await inventoryService.checkAvailability(
      params.vaccineInventoryId,
      dosageAmount
    )

    if (!availability.available) {
      throw new Error(
        `Insufficient vaccine inventory: ${availability.itemName} - ` +
        `Need ${availability.requiredQuantity}${availability.unit}, ` +
        `have ${availability.currentQuantity}${availability.unit}`
      )
    }

    // 2. Create health record
    const record = healthRecordManager.createHealthRecord(
      params.cattleId,
      params.cattleTagNumber,
      "vaccination",
      params.recordedBy
    )

    // 3. Add vaccination details
    const enrichedRecord = healthRecordManager.addVaccination(
      record,
      params.vaccineType,
      params.vaccineName,
      params.dose,
      params.route,
      params.site,
      {
        manufacturer: params.manufacturer,
        lotNumber: params.lotNumber,
        boosterDue: params.boosterDue
      }
    )

    // Add cost
    const inventoryItem = inventoryService.getItem(params.vaccineInventoryId)
    enrichedRecord.cost = inventoryItem ? inventoryItem.costPerUnit * dosageAmount : 0

    // 4. Deduct from inventory
    let transaction: InventoryTransaction
    try {
      transaction = await inventoryService.deduct({
        itemId: params.vaccineInventoryId,
        quantity: dosageAmount,
        reason: `Vaccination for cattle ${params.cattleTagNumber}`,
        performedBy: params.recordedBy,
        relatedRecordType: "health_record",
        relatedRecordId: enrichedRecord.id
      })
    } catch (error) {
      throw new Error(`Inventory deduction failed: ${(error as Error).message}`)
    }

    // 5. Save health record
    this.healthRecords.push(enrichedRecord)
    this.save()

    return {
      healthRecord: enrichedRecord,
      inventoryTransaction: transaction
    }
  }

  /**
   * Bulk treatment - Process multiple cattle with the same treatment
   * More efficient than individual treatments for large groups
   */
  async bulkTreatment(params: {
    cattleList: Array<{ cattleId: string; tagNumber: string; weight?: number }>
    drugName: string
    drugInventoryId: string
    dosagePerHead: number
    dosageUnit: "cc" | "ml" | "doses"
    administrationRoute: "IM" | "SQ" | "IV" | "Oral"
    withdrawalPeriod?: number
    notes?: string
    recordedBy: string
  }): Promise<{
    successful: TreatmentResult[]
    failed: Array<{ cattleId: string; error: string }>
    totalDrugUsed: number
    totalCost: number
  }> {
    const successful: TreatmentResult[] = []
    const failed: Array<{ cattleId: string; error: string }> = []

    // 1. Calculate total drug requirement
    const totalDrugNeeded = params.cattleList.length * params.dosagePerHead

    // 2. Check if sufficient inventory BEFORE processing any animals
    const availability = await inventoryService.checkAvailability(
      params.drugInventoryId,
      totalDrugNeeded
    )

    if (!availability.available) {
      throw new Error(
        `Insufficient inventory for bulk treatment: ${availability.itemName} - ` +
        `Need ${totalDrugNeeded}${params.dosageUnit} for ${params.cattleList.length} animals, ` +
        `have ${availability.currentQuantity}${params.dosageUnit}`
      )
    }

    // 3. Process each animal
    for (const cattle of params.cattleList) {
      try {
        const result = await this.recordTreatment({
          cattleId: cattle.cattleId,
          cattleTagNumber: cattle.tagNumber,
          drugName: params.drugName,
          drugInventoryId: params.drugInventoryId,
          dosageAmount: params.dosagePerHead,
          dosageUnit: params.dosageUnit,
          administrationRoute: params.administrationRoute,
          withdrawalPeriod: params.withdrawalPeriod,
          cattleWeight: cattle.weight,
          notes: params.notes,
          recordedBy: params.recordedBy
        })

        successful.push(result)
      } catch (error) {
        failed.push({
          cattleId: cattle.cattleId,
          error: (error as Error).message
        })
      }
    }

    // 4. Calculate totals
    const totalCost = successful.reduce((sum, r) => sum + (r.healthRecord.cost || 0), 0)

    return {
      successful,
      failed,
      totalDrugUsed: successful.length * params.dosagePerHead,
      totalCost
    }
  }

  /**
   * Get all health records
   */
  getHealthRecords(): HealthRecord[] {
    return this.healthRecords
  }

  /**
   * Get health records for specific cattle
   */
  getCattleHealthRecords(cattleId: string): HealthRecord[] {
    return this.healthRecords.filter((r) => r.cattleId === cattleId)
  }

  /**
   * Get recent treatments (last 30 days)
   */
  getRecentTreatments(days: number = 30): HealthRecord[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return this.healthRecords.filter((r) => {
      const recordDate = new Date(r.date)
      return recordDate >= cutoff
    })
  }

  /**
   * Get cattle in withdrawal period
   */
  getCattleInWithdrawal(): Array<{
    cattleId: string
    tagNumber: string
    withdrawalDate: string
    treatment: string
  }> {
    const now = new Date()
    const inWithdrawal: Array<{
      cattleId: string
      tagNumber: string
      withdrawalDate: string
      treatment: string
    }> = []

    this.healthRecords.forEach((record) => {
      if (record.antibioticTreatment) {
        const withdrawalDate = new Date(record.antibioticTreatment.withdrawalDate)
        if (withdrawalDate > now) {
          inWithdrawal.push({
            cattleId: record.cattleId,
            tagNumber: record.cattleTagNumber,
            withdrawalDate: record.antibioticTreatment.withdrawalDate,
            treatment: record.antibioticTreatment.name
          })
        }
      }
    })

    return inWithdrawal
  }

  /**
   * Get treatment summary/stats
   */
  getTreatmentStats(dateRange?: { start: string; end: string }): {
    totalTreatments: number
    totalCost: number
    treatmentsByDrug: Record<string, { count: number; cost: number }>
    cattleTreated: number
  } {
    let records = this.healthRecords

    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      records = records.filter((r) => {
        const date = new Date(r.date)
        return date >= start && date <= end
      })
    }

    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0)
    const uniqueCattle = new Set(records.map((r) => r.cattleId)).size

    const treatmentsByDrug: Record<string, { count: number; cost: number }> = {}

    records.forEach((r) => {
      let drugName = "Unknown"

      if (r.antibioticTreatment) {
        drugName = r.antibioticTreatment.name
      } else if (r.vaccination) {
        drugName = r.vaccination.name
      }

      if (!treatmentsByDrug[drugName]) {
        treatmentsByDrug[drugName] = { count: 0, cost: 0 }
      }

      treatmentsByDrug[drugName].count++
      treatmentsByDrug[drugName].cost += r.cost || 0
    })

    return {
      totalTreatments: records.length,
      totalCost,
      treatmentsByDrug,
      cattleTreated: uniqueCattle
    }
  }

  /**
   * Update health record
   */
  updateHealthRecord(id: string, updates: Partial<HealthRecord>): HealthRecord | null {
    const index = this.healthRecords.findIndex((r) => r.id === id)
    if (index === -1) return null

    this.healthRecords[index] = {
      ...this.healthRecords[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.save()
    return this.healthRecords[index]
  }

  /**
   * Delete health record (rarely used - health records should be preserved for audit)
   */
  deleteHealthRecord(id: string): boolean {
    const initialLength = this.healthRecords.length
    this.healthRecords = this.healthRecords.filter((r) => r.id !== id)

    if (this.healthRecords.length < initialLength) {
      this.save()
      return true
    }

    return false
  }
}

export const healthService = HealthService.getInstance()
