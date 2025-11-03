// Automated Cost Calculation Engine
// Calculates Cost Per Head, Cost Per Pen, Cost of Gain, and Break-Even Prices

import { dataStore, type Cattle } from "./data-store"
import { treatmentStore } from "./treatment-store"
import { enhancedFeedStore } from "./enhanced-feed-store"

export interface CattleCostBreakdown {
  cattleId: string
  tagNumber: string

  // Purchase costs
  purchasePrice: number
  purchaseWeight: number
  purchasePricePerPound: number

  // Current metrics
  currentWeight: number
  daysOnFeed: number
  totalWeightGain: number
  averageDailyGain: number

  // Cost components
  feedCost: number
  treatmentCost: number
  healthCost: number
  totalVariableCost: number
  totalCostBasis: number // Purchase + all costs

  // Performance metrics
  costPerPound: number // Total cost basis / current weight
  costOfGain: number // Variable costs / weight gain
  breakEvenLivePrice: number // Cost per pound to break even
  breakEvenCarcassPrice: number // Adjusted for dressing percentage

  // Profit/Loss (if selling at market price)
  estimatedMarketValue: number
  estimatedProfit: number
  returnOnInvestment: number // Percentage
}

export interface PenCostBreakdown {
  penId: string
  penName: string
  headCount: number

  // Aggregate costs
  totalPurchaseCost: number
  totalFeedCost: number
  totalTreatmentCost: number
  totalHealthCost: number
  totalInvestment: number

  // Averages
  averageCostPerHead: number
  averageFeedCostPerHead: number
  averageTreatmentCostPerHead: number
  averageDaysOnFeed: number
  averageWeightPerHead: number
  averageWeightGain: number
  averageDailyGain: number

  // Performance
  averageCostOfGain: number
  averageBreakEvenLivePrice: number
  averageBreakEvenCarcassPrice: number

  // Profit/Loss
  totalEstimatedValue: number
  totalEstimatedProfit: number
  averageROI: number
}

export class CostCalculator {
  private static instance: CostCalculator

  // Market assumptions (can be customized)
  private marketPriceLive = 1.85 // $ per pound live weight
  private dressingPercentage = 63 // % carcass yield
  private estimatedFeedCostPerDay = 3.50 // Default if no feed records

  private constructor() {}

  static getInstance(): CostCalculator {
    if (!CostCalculator.instance) {
      CostCalculator.instance = new CostCalculator()
    }
    return CostCalculator.instance
  }

  // Set market parameters
  setMarketPrice(pricePerPound: number) {
    this.marketPriceLive = pricePerPound
  }

  setDressingPercentage(percentage: number) {
    this.dressingPercentage = percentage
  }

  // Calculate comprehensive costs for a single head
  calculateCattleCosts(cattleId: string, dateRange?: { start: string; end: string }): CattleCostBreakdown | null {
    const cattle = dataStore.getCattleById(cattleId)
    if (!cattle || cattle.status !== "Active") return null

    // Purchase information
    const purchasePrice = cattle.purchasePrice || 0
    const purchaseWeight = Number(cattle.purchaseWeight) || cattle.weight * 0.6 // Estimate if not provided
    const purchasePricePerPound = purchaseWeight > 0 ? purchasePrice / purchaseWeight : 0

    // Current weight (use latest weight record or current weight)
    const weightRecords = dataStore.getWeightRecords(cattleId)
    const currentWeight = weightRecords.length > 0
      ? weightRecords[weightRecords.length - 1].weight
      : cattle.weight

    const totalWeightGain = currentWeight - purchaseWeight

    // Days on feed
    const purchaseDate = cattle.purchaseDate ? new Date(cattle.purchaseDate) : new Date(cattle.birthDate)
    const daysOnFeed = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageDailyGain = daysOnFeed > 0 ? totalWeightGain / daysOnFeed : 0

    // Feed costs - check if cattle has pen, then calculate feed allocation
    let feedCost = 0
    if (cattle.penId) {
      const penAllocations = enhancedFeedStore.getPenAllocations(cattle.penId)

      // Filter by date range if provided
      let filteredAllocations = penAllocations
      if (dateRange) {
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        filteredAllocations = penAllocations.filter((a) => {
          const date = new Date(a.date)
          return date >= start && date <= end
        })
      }

      // Sum up cost per head from each allocation
      feedCost = filteredAllocations.reduce((sum, allocation) => {
        return sum + allocation.costPerHead
      }, 0)
    }

    // If no feed records, estimate based on days on feed
    if (feedCost === 0 && daysOnFeed > 0) {
      feedCost = daysOnFeed * this.estimatedFeedCostPerDay
    }

    // Treatment costs
    const treatments = treatmentStore.getCattleTreatments(cattleId)
    let treatmentCost = treatments.reduce((sum, t) => sum + t.cost, 0)

    // Filter by date range if provided
    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      treatmentCost = treatments
        .filter((t) => {
          const date = new Date(t.date)
          return date >= start && date <= end
        })
        .reduce((sum, t) => sum + t.cost, 0)
    }

    // Health costs (vet visits, etc.)
    const healthRecords = dataStore.getHealthRecords(cattleId)
    let healthCost = healthRecords.reduce((sum, h) => sum + (h.cost || 0), 0)

    // Filter by date range if provided
    if (dateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      healthCost = healthRecords
        .filter((h) => {
          const date = new Date(h.date)
          return date >= start && date <= end
        })
        .reduce((sum, h) => sum + (h.cost || 0), 0)
    }

    // Total costs
    const totalVariableCost = feedCost + treatmentCost + healthCost
    const totalCostBasis = purchasePrice + totalVariableCost

    // Performance metrics
    const costPerPound = currentWeight > 0 ? totalCostBasis / currentWeight : 0
    const costOfGain = totalWeightGain > 0 ? totalVariableCost / totalWeightGain : 0

    // Break-even prices
    const breakEvenLivePrice = costPerPound
    const carcassWeight = currentWeight * (this.dressingPercentage / 100)
    const breakEvenCarcassPrice = carcassWeight > 0 ? totalCostBasis / carcassWeight : 0

    // Estimated value and profit
    const estimatedMarketValue = currentWeight * this.marketPriceLive
    const estimatedProfit = estimatedMarketValue - totalCostBasis
    const returnOnInvestment = totalCostBasis > 0 ? (estimatedProfit / totalCostBasis) * 100 : 0

    return {
      cattleId,
      tagNumber: cattle.tagNumber,
      purchasePrice,
      purchaseWeight,
      purchasePricePerPound,
      currentWeight,
      daysOnFeed,
      totalWeightGain,
      averageDailyGain,
      feedCost,
      treatmentCost,
      healthCost,
      totalVariableCost,
      totalCostBasis,
      costPerPound,
      costOfGain,
      breakEvenLivePrice,
      breakEvenCarcassPrice,
      estimatedMarketValue,
      estimatedProfit,
      returnOnInvestment,
    }
  }

  // Calculate comprehensive costs for a pen
  calculatePenCosts(penId: string, dateRange?: { start: string; end: string }): PenCostBreakdown | null {
    const pen = dataStore.getCattle().find((c) => c.penId === penId)
    if (!pen) return null

    // Get all cattle in pen
    const cattle = dataStore.getCattle().filter((c) => c.penId === penId && c.status === "Active")

    if (cattle.length === 0) {
      return {
        penId,
        penName: "Unknown Pen",
        headCount: 0,
        totalPurchaseCost: 0,
        totalFeedCost: 0,
        totalTreatmentCost: 0,
        totalHealthCost: 0,
        totalInvestment: 0,
        averageCostPerHead: 0,
        averageFeedCostPerHead: 0,
        averageTreatmentCostPerHead: 0,
        averageDaysOnFeed: 0,
        averageWeightPerHead: 0,
        averageWeightGain: 0,
        averageDailyGain: 0,
        averageCostOfGain: 0,
        averageBreakEvenLivePrice: 0,
        averageBreakEvenCarcassPrice: 0,
        totalEstimatedValue: 0,
        totalEstimatedProfit: 0,
        averageROI: 0,
      }
    }

    // Calculate costs for each animal
    const costBreakdowns = cattle
      .map((c) => this.calculateCattleCosts(c.id, dateRange))
      .filter((c): c is CattleCostBreakdown => c !== null)

    const headCount = costBreakdowns.length

    // Aggregate totals
    const totalPurchaseCost = costBreakdowns.reduce((sum, c) => sum + c.purchasePrice, 0)
    const totalFeedCost = costBreakdowns.reduce((sum, c) => sum + c.feedCost, 0)
    const totalTreatmentCost = costBreakdowns.reduce((sum, c) => sum + c.treatmentCost, 0)
    const totalHealthCost = costBreakdowns.reduce((sum, c) => sum + c.healthCost, 0)
    const totalInvestment = costBreakdowns.reduce((sum, c) => sum + c.totalCostBasis, 0)
    const totalEstimatedValue = costBreakdowns.reduce((sum, c) => sum + c.estimatedMarketValue, 0)
    const totalEstimatedProfit = totalEstimatedValue - totalInvestment

    // Averages
    const averageCostPerHead = headCount > 0 ? totalInvestment / headCount : 0
    const averageFeedCostPerHead = headCount > 0 ? totalFeedCost / headCount : 0
    const averageTreatmentCostPerHead = headCount > 0 ? totalTreatmentCost / headCount : 0
    const averageDaysOnFeed = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.daysOnFeed, 0) / headCount
      : 0
    const averageWeightPerHead = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.currentWeight, 0) / headCount
      : 0
    const averageWeightGain = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.totalWeightGain, 0) / headCount
      : 0
    const averageDailyGain = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.averageDailyGain, 0) / headCount
      : 0
    const averageCostOfGain = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.costOfGain, 0) / headCount
      : 0
    const averageBreakEvenLivePrice = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.breakEvenLivePrice, 0) / headCount
      : 0
    const averageBreakEvenCarcassPrice = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.breakEvenCarcassPrice, 0) / headCount
      : 0
    const averageROI = headCount > 0
      ? costBreakdowns.reduce((sum, c) => sum + c.returnOnInvestment, 0) / headCount
      : 0

    return {
      penId,
      penName: cattle[0]?.penId || "Unknown Pen",
      headCount,
      totalPurchaseCost,
      totalFeedCost,
      totalTreatmentCost,
      totalHealthCost,
      totalInvestment,
      averageCostPerHead,
      averageFeedCostPerHead,
      averageTreatmentCostPerHead,
      averageDaysOnFeed,
      averageWeightPerHead,
      averageWeightGain,
      averageDailyGain,
      averageCostOfGain,
      averageBreakEvenLivePrice,
      averageBreakEvenCarcassPrice,
      totalEstimatedValue,
      totalEstimatedProfit,
      averageROI,
    }
  }

  // Calculate costs across all active cattle
  calculateOperationCosts(dateRange?: { start: string; end: string }) {
    const activeCattle = dataStore.getCattle().filter((c) => c.status === "Active")

    const costBreakdowns = activeCattle
      .map((c) => this.calculateCattleCosts(c.id, dateRange))
      .filter((c): c is CattleCostBreakdown => c !== null)

    const headCount = costBreakdowns.length

    return {
      headCount,
      totalInvestment: costBreakdowns.reduce((sum, c) => sum + c.totalCostBasis, 0),
      totalFeedCost: costBreakdowns.reduce((sum, c) => sum + c.feedCost, 0),
      totalTreatmentCost: costBreakdowns.reduce((sum, c) => sum + c.treatmentCost, 0),
      totalEstimatedValue: costBreakdowns.reduce((sum, c) => sum + c.estimatedMarketValue, 0),
      totalEstimatedProfit: costBreakdowns.reduce((sum, c) => sum + c.estimatedProfit, 0),
      averageCostPerHead: headCount > 0
        ? costBreakdowns.reduce((sum, c) => sum + c.totalCostBasis, 0) / headCount
        : 0,
      averageCostOfGain: headCount > 0
        ? costBreakdowns.reduce((sum, c) => sum + c.costOfGain, 0) / headCount
        : 0,
      averageBreakEvenPrice: headCount > 0
        ? costBreakdowns.reduce((sum, c) => sum + c.breakEvenLivePrice, 0) / headCount
        : 0,
      averageROI: headCount > 0
        ? costBreakdowns.reduce((sum, c) => sum + c.returnOnInvestment, 0) / headCount
        : 0,
    }
  }
}

export const costCalculator = CostCalculator.getInstance()
