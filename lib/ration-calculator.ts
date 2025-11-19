/**
 * Ration Calculator Engine
 * Calculates days remaining, feed consumption, and KPIs
 */

import { rationStore, type Ration, type PenRationAssignment } from "./ration-store"
import { dataStore } from "./data-store"

export interface FeedInventoryStatus {
  feedId: string
  feedName: string
  currentStock: number // lbs
  dailyConsumption: number // lbs/day across all pens
  daysRemaining: number
  status: "adequate" | "low" | "critical" | "out"
  reorderPoint: number
  pensUsing: string[] // Pen IDs using this feed
}

export interface PenFeedConsumption {
  penId: string
  penName: string
  rationId: string
  rationName: string
  headCount: number
  dailyConsumptionPerHead: number // lbs/head/day
  totalDailyConsumption: number // lbs/day for entire pen
  monthlyCost: number
  ingredients: {
    feedId: string
    feedName: string
    dailyAmount: number // lbs/day for entire pen
    monthlyCost: number
  }[]
}

export interface RationPerformanceMetrics {
  rationId: string
  rationName: string
  pensUsing: number
  totalHeadCount: number
  averageADG: number // Actual ADG from cattle data
  targetADG: number // Target from ration KPIs
  adgVariance: number // % difference
  feedConversion: number // Actual feed:gain ratio
  targetFeedConversion: number
  fcVariance: number
  totalDailyCost: number
  costPerPoundGain: number
}

class RationCalculator {
  /**
   * Calculate days remaining for all feed inventory items
   */
  calculateInventoryStatus(): FeedInventoryStatus[] {
    const feeds = dataStore.getFeedInventory()
    const activeAssignments = rationStore.getActiveAssignments()
    const rations = rationStore.getRations()

    return feeds.map((feed) => {
      // Calculate total daily consumption across all pens
      let dailyConsumption = 0
      const pensUsing: string[] = []

      activeAssignments.forEach((assignment) => {
        const ration = rations.find((r) => r.id === assignment.rationId)
        if (!ration) return

        // Check if this ration uses this feed
        const ingredient = ration.ingredients.find((ing) => ing.feedId === feed.id)
        if (ingredient) {
          const penConsumption = ingredient.amountLbs * assignment.headCount
          dailyConsumption += penConsumption
          if (!pensUsing.includes(assignment.penId)) {
            pensUsing.push(assignment.penId)
          }
        }
      })

      const daysRemaining = dailyConsumption > 0 ? feed.quantity / dailyConsumption : Infinity

      let status: "adequate" | "low" | "critical" | "out"
      if (feed.quantity === 0) {
        status = "out"
      } else if (daysRemaining < 3) {
        status = "critical"
      } else if (daysRemaining < 7) {
        status = "low"
      } else {
        status = "adequate"
      }

      return {
        feedId: feed.id,
        feedName: feed.name,
        currentStock: feed.quantity,
        dailyConsumption,
        daysRemaining: daysRemaining === Infinity ? 9999 : daysRemaining,
        status,
        reorderPoint: dailyConsumption * 7, // 7 days buffer
        pensUsing,
      }
    })
  }

  /**
   * Calculate feed consumption for a specific pen
   */
  calculatePenConsumption(penId: string): PenFeedConsumption | null {
    const assignment = rationStore.getPenAssignment(penId)
    if (!assignment) return null

    const ration = rationStore.getRation(assignment.rationId)
    if (!ration) return null

    const dailyConsumptionPerHead = ration.totalLbsPerHead
    const totalDailyConsumption = dailyConsumptionPerHead * assignment.headCount

    const ingredients = ration.ingredients.map((ing) => {
      const dailyAmount = ing.amountLbs * assignment.headCount
      const monthlyCost = dailyAmount * ing.costPerLb * 30

      return {
        feedId: ing.feedId,
        feedName: ing.feedName,
        dailyAmount,
        monthlyCost,
      }
    })

    const monthlyCost = ration.kpis.costPerHead * assignment.headCount * 30

    return {
      penId,
      penName: assignment.penName,
      rationId: ration.id,
      rationName: ration.name,
      headCount: assignment.headCount,
      dailyConsumptionPerHead,
      totalDailyConsumption,
      monthlyCost,
      ingredients,
    }
  }

  /**
   * Calculate consumption for all active pens
   */
  calculateAllPenConsumption(): PenFeedConsumption[] {
    const activeAssignments = rationStore.getActiveAssignments()
    const consumptions: PenFeedConsumption[] = []

    activeAssignments.forEach((assignment) => {
      const consumption = this.calculatePenConsumption(assignment.penId)
      if (consumption) {
        consumptions.push(consumption)
      }
    })

    return consumptions
  }

  /**
   * Calculate performance metrics for a ration
   */
  calculateRationPerformance(rationId: string): RationPerformanceMetrics | null {
    const ration = rationStore.getRation(rationId)
    if (!ration) return null

    const stats = rationStore.getRationUsageStats(rationId)
    const activeAssignments = stats.activeAssignments

    if (activeAssignments.length === 0) {
      return {
        rationId,
        rationName: ration.name,
        pensUsing: 0,
        totalHeadCount: 0,
        averageADG: 0,
        targetADG: ration.kpis.targetADG,
        adgVariance: 0,
        feedConversion: 0,
        targetFeedConversion: ration.kpis.targetFeedConversion,
        fcVariance: 0,
        totalDailyCost: 0,
        costPerPoundGain: ration.kpis.costPerPound,
      }
    }

    // Calculate actual ADG from cattle in pens using this ration
    let totalADG = 0
    let cattleCount = 0

    activeAssignments.forEach((assignment) => {
      const cattle = dataStore.getCattleSync().filter((c) => c.penId === assignment.penId)

      cattle.forEach((animal) => {
        if (animal.purchaseDate && animal.purchaseWeight && animal.weight) {
          const daysOnFeed = Math.floor(
            (new Date().getTime() - new Date(animal.purchaseDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )

          if (daysOnFeed > 0) {
            const weightGain = animal.weight - animal.purchaseWeight
            const adg = weightGain / daysOnFeed
            totalADG += adg
            cattleCount++
          }
        }
      })
    })

    const averageADG = cattleCount > 0 ? totalADG / cattleCount : 0
    const adgVariance =
      ration.kpis.targetADG > 0
        ? ((averageADG - ration.kpis.targetADG) / ration.kpis.targetADG) * 100
        : 0

    // Calculate feed conversion (feed consumed / weight gained)
    const feedConversion =
      averageADG > 0 ? ration.totalLbsPerHead / averageADG : ration.kpis.targetFeedConversion

    const fcVariance =
      ration.kpis.targetFeedConversion > 0
        ? ((feedConversion - ration.kpis.targetFeedConversion) /
            ration.kpis.targetFeedConversion) *
          100
        : 0

    const totalDailyCost = ration.kpis.costPerHead * stats.totalHeadCount

    return {
      rationId,
      rationName: ration.name,
      pensUsing: stats.pensUsing,
      totalHeadCount: stats.totalHeadCount,
      averageADG,
      targetADG: ration.kpis.targetADG,
      adgVariance,
      feedConversion,
      targetFeedConversion: ration.kpis.targetFeedConversion,
      fcVariance,
      totalDailyCost,
      costPerPoundGain: averageADG > 0 ? ration.kpis.costPerHead / averageADG : 0,
    }
  }

  /**
   * Get low inventory alerts
   */
  getLowInventoryAlerts(): FeedInventoryStatus[] {
    const inventoryStatus = this.calculateInventoryStatus()
    return inventoryStatus.filter((item) => item.status === "low" || item.status === "critical")
  }

  /**
   * Calculate projected feed needs for next N days
   */
  calculateProjectedNeeds(days: number = 30): {
    feedId: string
    feedName: string
    currentStock: number
    projectedConsumption: number
    projectedShortfall: number
    estimatedCost: number
  }[] {
    const inventoryStatus = this.calculateInventoryStatus()
    const feeds = dataStore.getFeedInventory()

    return inventoryStatus.map((status) => {
      const projectedConsumption = status.dailyConsumption * days
      const projectedShortfall = Math.max(0, projectedConsumption - status.currentStock)

      const feed = feeds.find((f) => f.id === status.feedId)
      const costPerUnit = feed?.costPerUnit || 0

      return {
        feedId: status.feedId,
        feedName: status.feedName,
        currentStock: status.currentStock,
        projectedConsumption,
        projectedShortfall,
        estimatedCost: projectedShortfall * costPerUnit,
      }
    })
  }

  /**
   * Calculate total feed costs across all pens
   */
  calculateTotalFeedCosts() {
    const penConsumptions = this.calculateAllPenConsumption()

    const dailyTotal = penConsumptions.reduce((sum, pen) => {
      return (
        sum +
        pen.ingredients.reduce((ingredientSum, ing) => {
          const feed = dataStore.getFeedInventory().find((f) => f.id === ing.feedId)
          return ingredientSum + ing.dailyAmount * (feed?.costPerUnit || 0)
        }, 0)
      )
    }, 0)

    return {
      dailyTotal,
      weeklyTotal: dailyTotal * 7,
      monthlyTotal: dailyTotal * 30,
      yearlyTotal: dailyTotal * 365,
    }
  }
}

export const rationCalculator = new RationCalculator()
