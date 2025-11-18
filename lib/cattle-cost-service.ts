/**
 * Cattle Cost Service
 * Calculates individual cattle costs based on pen-level feed and medication allocations
 */

import { feedService, type FeedAllocationRecord } from "@/lib/feed/feed-service"
import { penActivityStore, type PenMedicationActivity, type PenFeedActivity } from "@/lib/pen-activity-store"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"

export interface CattleFeedHistory {
  allocation: FeedAllocationRecord
  cattleCost: number // Cost allocated to this individual cattle
  cattleShare: number // Percentage of total allocation
}

export interface CattleFeedActivityHistory {
  activity: PenFeedActivity
  cattleCost: number // Cost allocated to this individual cattle
  cattleAmount: number // Amount of feed for this individual cattle
}

export interface CattleMedicationHistory {
  activity: PenMedicationActivity
  cattleCost: number // Cost allocated to this individual cattle
  cattleDosage: number // Dosage given to this individual cattle
}

export interface CattleCostSummary {
  feedCost: number
  medicationCost: number
  healthRecordCost: number
  totalVariableCost: number
  feedAllocations: CattleFeedHistory[]
  feedActivities: CattleFeedActivityHistory[]
  medications: CattleMedicationHistory[]
}

class CattleCostService {
  /**
   * Calculate feed cost for an individual cattle based on pen allocations
   * Combines costs from both feedService (detailed allocations) and penActivityStore (simple feed activities)
   */
  async getCattleFeedCost(cattleId: string, startDate?: string, endDate?: string): Promise<number> {
    const cattle = await this.getCattle(cattleId)
    if (!cattle || !cattle.penId) return 0

    // Get costs from feedService allocations (detailed allocation records)
    const allocations = feedService.getPenAllocations(cattle.penId)
    let filteredAllocations = allocations

    if (startDate) {
      filteredAllocations = filteredAllocations.filter(a => a.date >= startDate)
    }
    if (endDate) {
      filteredAllocations = filteredAllocations.filter(a => a.date <= endDate)
    }

    const allocationCost = filteredAllocations.reduce((total, allocation) => {
      const perCattleCost = allocation.costPerHead || (allocation.totalCost / allocation.headCount)
      return total + perCattleCost
    }, 0)

    // Get costs from penActivityStore feed activities
    const activities = penActivityStore.getFeedActivitiesByPen(cattle.penId)
    let filteredActivities = activities

    if (startDate) {
      filteredActivities = filteredActivities.filter(a => a.date >= startDate)
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => a.date <= endDate)
    }

    const activityCost = filteredActivities.reduce((total, activity) => {
      const perCattleCost = activity.totalCost / activity.cattleCount
      return total + perCattleCost
    }, 0)

    return allocationCost + activityCost
  }

  /**
   * Get feed allocation history for a cattle with per-cattle costs
   */
  async getCattleFeedHistory(cattleId: string, startDate?: string, endDate?: string): Promise<CattleFeedHistory[]> {
    const cattle = await this.getCattle(cattleId)
    if (!cattle || !cattle.penId) return []

    const allocations = feedService.getPenAllocations(cattle.penId)
    let filteredAllocations = allocations

    // Filter by date range
    if (startDate) {
      filteredAllocations = filteredAllocations.filter(a => a.date >= startDate)
    }
    if (endDate) {
      filteredAllocations = filteredAllocations.filter(a => a.date <= endDate)
    }

    return filteredAllocations.map(allocation => {
      const perCattleCost = allocation.costPerHead || (allocation.totalCost / allocation.headCount)
      const cattleShare = (1 / allocation.headCount) * 100

      return {
        allocation,
        cattleCost: perCattleCost,
        cattleShare
      }
    })
  }

  /**
   * Calculate medication cost for an individual cattle based on pen activities
   */
  async getCattleMedicationCost(cattleId: string, startDate?: string, endDate?: string): Promise<number> {
    const cattle = await this.getCattle(cattleId)
    if (!cattle || !cattle.penId) return 0

    const medications = penActivityStore.getMedicationActivitiesByPen(cattle.penId)
    let filteredMedications = medications

    // Filter by date range
    if (startDate) {
      filteredMedications = filteredMedications.filter(m => m.date >= startDate)
    }
    if (endDate) {
      filteredMedications = filteredMedications.filter(m => m.date <= endDate)
    }

    // Calculate per-cattle cost
    return filteredMedications.reduce((total, medication) => {
      const perCattleCost = medication.costPerHead
      return total + perCattleCost
    }, 0)
  }

  /**
   * Get medication history for a cattle with per-cattle costs and dosages
   */
  async getCattleMedicationHistory(cattleId: string, startDate?: string, endDate?: string): Promise<CattleMedicationHistory[]> {
    const cattle = await this.getCattle(cattleId)
    if (!cattle || !cattle.penId) return []

    const medications = penActivityStore.getMedicationActivitiesByPen(cattle.penId)
    let filteredMedications = medications

    // Filter by date range
    if (startDate) {
      filteredMedications = filteredMedications.filter(m => m.date >= startDate)
    }
    if (endDate) {
      filteredMedications = filteredMedications.filter(m => m.date <= endDate)
    }

    return filteredMedications.map(medication => ({
      activity: medication,
      cattleCost: medication.costPerHead,
      cattleDosage: medication.dosagePerHead
    }))
  }

  /**
   * Get feed activity history from penActivityStore
   */
  async getCattleFeedActivityHistory(cattleId: string, startDate?: string, endDate?: string): Promise<CattleFeedActivityHistory[]> {
    const cattle = await this.getCattle(cattleId)
    if (!cattle || !cattle.penId) return []

    const activities = penActivityStore.getFeedActivitiesByPen(cattle.penId)
    let filteredActivities = activities

    if (startDate) {
      filteredActivities = filteredActivities.filter(a => a.date >= startDate)
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => a.date <= endDate)
    }

    return filteredActivities.map(activity => ({
      activity,
      cattleCost: activity.totalCost / activity.cattleCount,
      cattleAmount: activity.averagePerCattle
    }))
  }

  /**
   * Get complete cost summary for a cattle
   */
  async getCattleCostSummary(cattleId: string, startDate?: string, endDate?: string): Promise<CattleCostSummary> {
    // Get feed costs and history from both pen-level sources
    const penFeedCost = await this.getCattleFeedCost(cattleId, startDate, endDate)
    const feedAllocations = await this.getCattleFeedHistory(cattleId, startDate, endDate)
    const feedActivities = await this.getCattleFeedActivityHistory(cattleId, startDate, endDate)

    // Get medication costs and history from pen-level sources
    const penMedicationCost = await this.getCattleMedicationCost(cattleId, startDate, endDate)
    const medications = await this.getCattleMedicationHistory(cattleId, startDate, endDate)

    // Get health record costs and separate individual feed/medication from true veterinary costs
    const healthRecords = await firebaseDataStore.getHealthRecords(cattleId)
    let filteredHealthRecords = healthRecords

    if (startDate) {
      filteredHealthRecords = filteredHealthRecords.filter(h => h.date >= startDate)
    }
    if (endDate) {
      filteredHealthRecords = filteredHealthRecords.filter(h => h.date <= endDate)
    }

    // Separate individual feed costs (health records with [FEED] marker)
    const individualFeedCost = filteredHealthRecords
      .filter(r => r.notes?.includes("[FEED]"))
      .reduce((sum, r) => sum + (r.cost || 0), 0)

    // Separate individual medication costs (health records with [MEDICATION] marker)
    const individualMedicationCost = filteredHealthRecords
      .filter(r => r.notes?.includes("[MEDICATION]"))
      .reduce((sum, r) => sum + (r.cost || 0), 0)

    // True veterinary costs (health records without [FEED] or [MEDICATION] markers)
    const healthRecordCost = filteredHealthRecords
      .filter(r => !r.notes?.includes("[FEED]") && !r.notes?.includes("[MEDICATION]"))
      .reduce((sum, r) => sum + (r.cost || 0), 0)

    // Combine pen-level and individual costs
    const feedCost = penFeedCost + individualFeedCost
    const medicationCost = penMedicationCost + individualMedicationCost

    // Calculate total variable costs
    const totalVariableCost = feedCost + medicationCost + healthRecordCost

    return {
      feedCost,
      medicationCost,
      healthRecordCost,
      totalVariableCost,
      feedAllocations,
      feedActivities,
      medications
    }
  }

  /**
   * Helper to get cattle data
   */
  private async getCattle(cattleId: string): Promise<Cattle | null> {
    const allCattle = await firebaseDataStore.getCattle()
    return allCattle.find(c => c.id === cattleId) || null
  }
}

export const cattleCostService = new CattleCostService()
