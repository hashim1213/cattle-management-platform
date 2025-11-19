/**
 * Growth Tracking Service
 * Calculates ADG, weight projections, feed efficiency, and growth metrics
 */

import { Cattle, WeightRecord } from "./data-store-firebase"
import { FeedAllocationRecord } from "./feed/feed-service"

export interface ADGCalculation {
  adg: number // Average Daily Gain in lbs/day
  startWeight: number
  endWeight: number
  startDate: string
  endDate: string
  days: number
  confidence: "high" | "medium" | "low" // Based on time period and data points
}

export interface WeightProjection {
  currentWeight: number
  projectedWeight: number
  projectionDate: string
  daysFromNow: number
  expectedADG: number
}

export interface DaysToTarget {
  targetWeight: number
  currentWeight: number
  expectedADG: number
  daysRemaining: number
  estimatedDate: string
  feasible: boolean
  message?: string
}

export interface FeedEfficiency {
  periodStart: string
  periodEnd: string
  totalFeedLbs: number
  weightGainLbs: number
  feedConversionRatio: number // Feed per lb of gain
  costPerLbGain: number
  totalFeedCost: number
}

export interface GrowthTimeline {
  date: string
  type: "weight" | "feed" | "projection" | "milestone"
  weight?: number
  adg?: number
  feedAmount?: number
  feedPerAnimal?: number
  notes?: string
  projectedWeight?: number
}

export interface CattleGrowthMetrics {
  cattleId: string
  tagNumber: string
  currentWeight: number
  currentADG: ADGCalculation | null
  lifetimeADG: ADGCalculation | null
  last30DaysADG: ADGCalculation | null
  projections: WeightProjection[]
  daysToMarket?: DaysToTarget
  feedEfficiency?: FeedEfficiency
  timeline: GrowthTimeline[]
}

class GrowthTrackingService {
  private static instance: GrowthTrackingService

  private constructor() {}

  static getInstance(): GrowthTrackingService {
    if (!GrowthTrackingService.instance) {
      GrowthTrackingService.instance = new GrowthTrackingService()
    }
    return GrowthTrackingService.instance
  }

  /**
   * Calculate ADG between two dates
   * ADG = (weight_now - weight_then) / days_between
   */
  calculateADG(
    startWeight: number,
    endWeight: number,
    startDate: string,
    endDate: string
  ): ADGCalculation {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const weightChange = endWeight - startWeight
    const adg = weightChange / days

    // Determine confidence based on time period
    let confidence: "high" | "medium" | "low" = "medium"
    if (days >= 60) confidence = "high"
    else if (days < 14) confidence = "low"

    return {
      adg,
      startWeight,
      endWeight,
      startDate,
      endDate,
      days,
      confidence,
    }
  }

  /**
   * Get current ADG from recent weight records
   */
  getCurrentADG(weightRecords: WeightRecord[]): ADGCalculation | null {
    if (weightRecords.length < 2) return null

    // Sort by date descending
    const sorted = [...weightRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Use last two weights
    const latest = sorted[0]
    const previous = sorted[1]

    return this.calculateADG(
      previous.weight,
      latest.weight,
      previous.date,
      latest.date
    )
  }

  /**
   * Get lifetime ADG from all weight records
   */
  getLifetimeADG(cattle: Cattle, weightRecords: WeightRecord[]): ADGCalculation | null {
    if (weightRecords.length === 0) return null

    const sorted = [...weightRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get earliest and latest weights
    const earliest = sorted[0]
    const latest = sorted[sorted.length - 1]

    // If we only have one weight record, use birth/purchase weight if available
    if (sorted.length === 1) {
      const startWeight = cattle.purchaseWeight || cattle.arrivalWeight
      const startDate = cattle.purchaseDate || cattle.arrivalDate || cattle.birthDate

      if (startWeight && startDate) {
        return this.calculateADG(startWeight, latest.weight, startDate, latest.date)
      }
      return null
    }

    return this.calculateADG(
      earliest.weight,
      latest.weight,
      earliest.date,
      latest.date
    )
  }

  /**
   * Get ADG for last N days
   */
  getRecentADG(weightRecords: WeightRecord[], days: number = 30): ADGCalculation | null {
    if (weightRecords.length < 2) return null

    const sorted = [...weightRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const latest = sorted[0]
    const cutoffDate = new Date(latest.date)
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Find weight closest to cutoff date
    const oldestInRange = sorted
      .filter(w => new Date(w.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    if (!oldestInRange || oldestInRange.id === latest.id) return null

    return this.calculateADG(
      oldestInRange.weight,
      latest.weight,
      oldestInRange.date,
      latest.date
    )
  }

  /**
   * Project future weight based on ADG
   */
  projectWeight(
    currentWeight: number,
    adg: number,
    daysInFuture: number
  ): WeightProjection {
    const projectedWeight = currentWeight + (adg * daysInFuture)
    const projectionDate = new Date()
    projectionDate.setDate(projectionDate.getDate() + daysInFuture)

    return {
      currentWeight,
      projectedWeight: Math.round(projectedWeight * 10) / 10,
      projectionDate: projectionDate.toISOString().split('T')[0],
      daysFromNow: daysInFuture,
      expectedADG: adg,
    }
  }

  /**
   * Calculate days to reach target weight
   * days_to_target = (target_weight - current_weight) / expected_ADG
   */
  calculateDaysToTarget(
    currentWeight: number,
    targetWeight: number,
    expectedADG: number
  ): DaysToTarget {
    if (expectedADG <= 0) {
      return {
        targetWeight,
        currentWeight,
        expectedADG,
        daysRemaining: -1,
        estimatedDate: "",
        feasible: false,
        message: "Cannot calculate: ADG is zero or negative",
      }
    }

    if (currentWeight >= targetWeight) {
      return {
        targetWeight,
        currentWeight,
        expectedADG,
        daysRemaining: 0,
        estimatedDate: new Date().toISOString().split('T')[0],
        feasible: true,
        message: "Already at or above target weight",
      }
    }

    const daysRemaining = Math.ceil((targetWeight - currentWeight) / expectedADG)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining)

    // Check if feasible (not too long)
    const feasible = daysRemaining <= 730 // 2 years max

    return {
      targetWeight,
      currentWeight,
      expectedADG,
      daysRemaining,
      estimatedDate: estimatedDate.toISOString().split('T')[0],
      feasible,
      message: feasible ? undefined : "Target weight may not be achievable with current ADG",
    }
  }

  /**
   * Calculate feed efficiency for a cattle in a pen
   */
  calculateFeedEfficiency(
    cattle: Cattle,
    weightRecords: WeightRecord[],
    feedAllocations: FeedAllocationRecord[],
    penId: string
  ): FeedEfficiency | null {
    if (weightRecords.length < 2 || feedAllocations.length === 0) return null

    // Get pen allocations
    const penAllocations = feedAllocations.filter(a => a.penId === penId)
    if (penAllocations.length === 0) return null

    // Sort weights by date
    const sortedWeights = [...weightRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const firstWeight = sortedWeights[0]
    const lastWeight = sortedWeights[sortedWeights.length - 1]
    const weightGain = lastWeight.weight - firstWeight.weight

    // Calculate total feed in the period
    const periodStart = firstWeight.date
    const periodEnd = lastWeight.date
    const allocationsInPeriod = penAllocations.filter(a =>
      a.date >= periodStart && a.date <= periodEnd
    )

    if (allocationsInPeriod.length === 0) return null

    // Sum up feed and cost
    const totalFeedLbs = allocationsInPeriod.reduce((sum, allocation) => {
      const feedForAnimal = allocation.totalWeight / allocation.headCount
      return sum + feedForAnimal
    }, 0)

    const totalFeedCost = allocationsInPeriod.reduce((sum, allocation) => {
      return sum + allocation.costPerHead
    }, 0)

    const feedConversionRatio = weightGain > 0 ? totalFeedLbs / weightGain : 0
    const costPerLbGain = weightGain > 0 ? totalFeedCost / weightGain : 0

    return {
      periodStart,
      periodEnd,
      totalFeedLbs: Math.round(totalFeedLbs * 10) / 10,
      weightGainLbs: Math.round(weightGain * 10) / 10,
      feedConversionRatio: Math.round(feedConversionRatio * 100) / 100,
      costPerLbGain: Math.round(costPerLbGain * 100) / 100,
      totalFeedCost: Math.round(totalFeedCost * 100) / 100,
    }
  }

  /**
   * Build growth timeline combining weights, feed, and projections
   */
  buildGrowthTimeline(
    cattle: Cattle,
    weightRecords: WeightRecord[],
    feedAllocations: FeedAllocationRecord[],
    projections: WeightProjection[]
  ): GrowthTimeline[] {
    const timeline: GrowthTimeline[] = []
    const penId = cattle.penId

    // Add weight records
    weightRecords.forEach(record => {
      timeline.push({
        date: record.date,
        type: "weight",
        weight: record.weight,
        notes: record.notes,
      })
    })

    // Add feed allocations for this cattle's pen
    if (penId) {
      const penAllocations = feedAllocations.filter(a => a.penId === penId)
      penAllocations.forEach(allocation => {
        const feedPerAnimal = allocation.totalWeight / allocation.headCount
        timeline.push({
          date: allocation.date,
          type: "feed",
          feedAmount: allocation.totalWeight,
          feedPerAnimal: Math.round(feedPerAnimal * 10) / 10,
          notes: `Fed to pen: ${allocation.penName}`,
        })
      })
    }

    // Add projections
    projections.forEach(proj => {
      timeline.push({
        date: proj.projectionDate,
        type: "projection",
        projectedWeight: proj.projectedWeight,
        adg: proj.expectedADG,
        notes: `Projected based on ${proj.expectedADG.toFixed(2)} lbs/day ADG`,
      })
    })

    // Sort by date
    timeline.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return timeline
  }

  /**
   * Get comprehensive growth metrics for a cattle
   */
  getCattleGrowthMetrics(
    cattle: Cattle,
    weightRecords: WeightRecord[],
    feedAllocations: FeedAllocationRecord[],
    targetWeight?: number,
    targetDailyGain: number = 2.5
  ): CattleGrowthMetrics {
    const currentADG = this.getCurrentADG(weightRecords)
    const lifetimeADG = this.getLifetimeADG(cattle, weightRecords)
    const last30DaysADG = this.getRecentADG(weightRecords, 30)

    // Use the most recent ADG for projections, or lifetime if not available, or user-configured target
    const projectionADG = currentADG?.adg || lifetimeADG?.adg || targetDailyGain

    // Create projections for 30, 60, 90, 120 days
    const projections: WeightProjection[] = [30, 60, 90, 120].map(days =>
      this.projectWeight(cattle.weight, projectionADG, days)
    )

    // Calculate days to target weight if specified
    let daysToMarket: DaysToTarget | undefined
    if (targetWeight) {
      daysToMarket = this.calculateDaysToTarget(
        cattle.weight,
        targetWeight,
        projectionADG
      )
    }

    // Calculate feed efficiency if in a pen
    let feedEfficiency: FeedEfficiency | undefined
    if (cattle.penId) {
      feedEfficiency = this.calculateFeedEfficiency(
        cattle,
        weightRecords,
        feedAllocations,
        cattle.penId
      ) || undefined
    }

    // Build timeline
    const timeline = this.buildGrowthTimeline(
      cattle,
      weightRecords,
      feedAllocations,
      projections
    )

    return {
      cattleId: cattle.id,
      tagNumber: cattle.tagNumber,
      currentWeight: cattle.weight,
      currentADG,
      lifetimeADG,
      last30DaysADG,
      projections,
      daysToMarket,
      feedEfficiency,
      timeline,
    }
  }

  /**
   * Estimate weight based on feed intake (simplified model)
   * This uses a basic feed conversion ratio of 6:1 (6 lbs feed = 1 lb gain)
   */
  estimateWeightFromFeed(
    currentWeight: number,
    feedLbs: number,
    feedConversionRatio: number = 6
  ): number {
    const estimatedGain = feedLbs / feedConversionRatio
    return Math.round((currentWeight + estimatedGain) * 10) / 10
  }

  /**
   * Get pen-level growth summary
   */
  getPenGrowthSummary(
    cattle: Cattle[],
    allWeightRecords: Map<string, WeightRecord[]>,
    feedAllocations: FeedAllocationRecord[],
    penId: string
  ) {
    const penCattle = cattle.filter(c => c.penId === penId)
    if (penCattle.length === 0) return null

    const adgs: number[] = []
    let totalCurrentWeight = 0
    let totalStartWeight = 0

    penCattle.forEach(c => {
      const weights = allWeightRecords.get(c.id) || []
      const adg = this.getCurrentADG(weights)
      if (adg) adgs.push(adg.adg)

      totalCurrentWeight += c.weight

      if (weights.length > 0) {
        const sorted = [...weights].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        totalStartWeight += sorted[0].weight
      } else {
        totalStartWeight += c.purchaseWeight || c.arrivalWeight || c.weight
      }
    })

    const avgADG = adgs.length > 0
      ? adgs.reduce((sum, adg) => sum + adg, 0) / adgs.length
      : 0

    const totalGain = totalCurrentWeight - totalStartWeight
    const avgWeightPerHead = totalCurrentWeight / penCattle.length

    // Calculate total feed to pen
    const penAllocations = feedAllocations.filter(a => a.penId === penId)
    const totalFeedCost = penAllocations.reduce((sum, a) => sum + a.totalCost, 0)
    const totalFeedWeight = penAllocations.reduce((sum, a) => sum + a.totalWeight, 0)

    return {
      penId,
      headCount: penCattle.length,
      avgADG: Math.round(avgADG * 100) / 100,
      avgWeightPerHead: Math.round(avgWeightPerHead),
      totalGain: Math.round(totalGain),
      totalFeedCost: Math.round(totalFeedCost * 100) / 100,
      totalFeedWeight: Math.round(totalFeedWeight),
      feedConversionRatio: totalGain > 0 ? Math.round((totalFeedWeight / totalGain) * 100) / 100 : 0,
    }
  }
}

export const growthTrackingService = GrowthTrackingService.getInstance()
