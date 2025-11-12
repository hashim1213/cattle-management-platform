/**
 * Financial Calculator
 * Calculate break-even points and profitability for individual animals or purchase groups
 */

export interface CattleCostBreakdown {
  // Purchase costs
  purchasePrice: number
  transportationCost: number
  commissionFees: number

  // Daily costs
  feedCostPerDay: number
  healthcareCostPerDay: number
  laborCostPerDay: number
  facilityCostPerDay: number

  // One-time costs
  vaccinations: number
  treatments: number
  equipmentAllocation: number

  // Days on feed
  daysOnFeed: number

  // Interest on capital
  interestRate: number // annual %
}

export interface BreakEvenAnalysis {
  totalCosts: {
    purchase: number
    feed: number
    healthcare: number
    labor: number
    facilities: number
    interest: number
    other: number
    total: number
  }

  currentMetrics: {
    currentWeight: number
    projectedFinalWeight: number
    totalGain: number
    averageDailyGain: number
    daysOnFeed: number
    costPerPound: number
    costPerDay: number
  }

  breakEven: {
    pricePerPound: number
    totalSalePrice: number
    margin: number
    marginPercentage: number
  }

  projectedProfit: {
    atCurrentMarketPrice: number
    atTargetPrice: number
    bestCase: number
    worstCase: number
  }

  recommendations: string[]
}

export interface GroupAnalysis {
  groupId: string
  groupName: string
  animalCount: number
  totalInvestment: number
  averageCostPerHead: number
  breakEvenPricePerCwt: number
  projectedRevenue: number
  projectedProfit: number
  roiPercentage: number
}

class FinancialCalculator {
  // Calculate break-even for a single animal
  calculateBreakEven(
    costs: CattleCostBreakdown,
    currentWeight: number,
    projectedFinalWeight: number,
    currentMarketPrice: number
  ): BreakEvenAnalysis {
    // Calculate total costs
    const purchaseCosts = costs.purchasePrice + costs.transportationCost + costs.commissionFees

    const dailyCosts = (
      costs.feedCostPerDay +
      costs.healthcareCostPerDay +
      costs.laborCostPerDay +
      costs.facilityCostPerDay
    ) * costs.daysOnFeed

    const feedCosts = costs.feedCostPerDay * costs.daysOnFeed
    const healthcareCosts = (costs.healthcareCostPerDay * costs.daysOnFeed) + costs.vaccinations + costs.treatments
    const laborCosts = costs.laborCostPerDay * costs.daysOnFeed
    const facilityCosts = costs.facilityCostPerDay * costs.daysOnFeed

    // Interest cost (simple interest on average capital)
    const averageCapital = purchaseCosts + (dailyCosts / 2)
    const interestCost = (averageCapital * costs.interestRate / 100) * (costs.daysOnFeed / 365)

    const otherCosts = costs.equipmentAllocation

    const totalCosts = purchaseCosts + dailyCosts + interestCost + otherCosts

    // Calculate metrics
    const totalGain = projectedFinalWeight - currentWeight
    const averageDailyGain = totalGain / costs.daysOnFeed
    const costPerPound = totalCosts / projectedFinalWeight
    const costPerDay = (feedCosts + healthcareCosts + laborCosts + facilityCosts) / costs.daysOnFeed

    // Break-even calculation
    const breakEvenPricePerPound = totalCosts / projectedFinalWeight
    const breakEvenPricePerCwt = breakEvenPricePerPound * 100
    const totalSalePrice = projectedFinalWeight * breakEvenPricePerPound

    // Projected profit at current market price
    const currentMarketRevenue = projectedFinalWeight * currentMarketPrice
    const profitAtCurrentPrice = currentMarketRevenue - totalCosts
    const marginPercentage = (profitAtCurrentPrice / totalCosts) * 100

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      costs,
      totalGain,
      averageDailyGain,
      breakEvenPricePerPound,
      currentMarketPrice,
      profitAtCurrentPrice
    )

    return {
      totalCosts: {
        purchase: purchaseCosts,
        feed: feedCosts,
        healthcare: healthcareCosts,
        labor: laborCosts,
        facilities: facilityCosts,
        interest: interestCost,
        other: otherCosts,
        total: totalCosts
      },
      currentMetrics: {
        currentWeight,
        projectedFinalWeight,
        totalGain,
        averageDailyGain,
        daysOnFeed: costs.daysOnFeed,
        costPerPound,
        costPerDay
      },
      breakEven: {
        pricePerPound: breakEvenPricePerPound,
        totalSalePrice,
        margin: profitAtCurrentPrice,
        marginPercentage
      },
      projectedProfit: {
        atCurrentMarketPrice: profitAtCurrentPrice,
        atTargetPrice: (projectedFinalWeight * (currentMarketPrice * 1.1)) - totalCosts,
        bestCase: (projectedFinalWeight * (currentMarketPrice * 1.2)) - totalCosts,
        worstCase: (projectedFinalWeight * (currentMarketPrice * 0.9)) - totalCosts
      },
      recommendations
    }
  }

  // Calculate break-even for a group/purchase lot
  calculateGroupBreakEven(
    animalCosts: CattleCostBreakdown[],
    weights: { current: number; projected: number }[],
    groupInfo: {
      groupId: string
      groupName: string
      currentMarketPrice: number
    }
  ): GroupAnalysis {
    const animalCount = animalCosts.length

    let totalInvestment = 0
    let totalProjectedRevenue = 0

    for (let i = 0; i < animalCount; i++) {
      const costs = animalCosts[i]
      const weight = weights[i]

      const analysis = this.calculateBreakEven(
        costs,
        weight.current,
        weight.projected,
        groupInfo.currentMarketPrice
      )

      totalInvestment += analysis.totalCosts.total
      totalProjectedRevenue += (weight.projected * groupInfo.currentMarketPrice)
    }

    const averageCostPerHead = totalInvestment / animalCount
    const projectedProfit = totalProjectedRevenue - totalInvestment
    const roiPercentage = (projectedProfit / totalInvestment) * 100

    // Calculate average break-even price per cwt
    const totalProjectedWeight = weights.reduce((sum, w) => sum + w.projected, 0)
    const breakEvenPricePerCwt = (totalInvestment / totalProjectedWeight) * 100

    return {
      groupId: groupInfo.groupId,
      groupName: groupInfo.groupName,
      animalCount,
      totalInvestment,
      averageCostPerHead,
      breakEvenPricePerCwt,
      projectedRevenue: totalProjectedRevenue,
      projectedProfit,
      roiPercentage
    }
  }

  // Generate recommendations based on analysis
  private generateRecommendations(
    costs: CattleCostBreakdown,
    totalGain: number,
    averageDailyGain: number,
    breakEvenPrice: number,
    marketPrice: number,
    projectedProfit: number
  ): string[] {
    const recommendations: string[] = []

    // ADG recommendations
    if (averageDailyGain < 2.5) {
      recommendations.push('Average daily gain is below target (2.5 lbs/day). Consider adjusting ration.')
    } else if (averageDailyGain > 3.5) {
      recommendations.push('Excellent weight gain! Current feeding program is effective.')
    }

    // Break-even vs market price
    const margin = ((marketPrice - breakEvenPrice) / breakEvenPrice) * 100
    if (margin < 5) {
      recommendations.push('Tight margins. Consider marketing soon or reducing costs.')
    } else if (margin > 15) {
      recommendations.push('Good profit margin. Monitor market for optimal selling time.')
    }

    // Feed costs
    const feedPercentage = (costs.feedCostPerDay * costs.daysOnFeed) /
      (costs.purchasePrice + costs.feedCostPerDay * costs.daysOnFeed)

    if (feedPercentage > 0.6) {
      recommendations.push('Feed costs are high. Evaluate feed efficiency and ration composition.')
    }

    // Healthcare costs
    if (costs.vaccinations + costs.treatments > costs.purchasePrice * 0.1) {
      recommendations.push('Healthcare costs are elevated. Review herd health protocol.')
    }

    // Days on feed
    if (costs.daysOnFeed > 180) {
      recommendations.push('Extended feeding period. Evaluate if additional days improve profitability.')
    }

    // Profitability
    if (projectedProfit < 0) {
      recommendations.push('⚠️ Projected loss. Consider early marketing or cost reduction strategies.')
    } else if (projectedProfit > costs.purchasePrice * 0.15) {
      recommendations.push('✓ Strong projected profit. Continue current strategy.')
    }

    return recommendations
  }

  // Calculate cost of gain
  calculateCostOfGain(
    feedCost: number,
    totalGain: number
  ): number {
    return feedCost / totalGain
  }

  // Calculate feed conversion ratio
  calculateFeedConversion(
    totalFeedConsumed: number,
    totalGain: number
  ): number {
    return totalFeedConsumed / totalGain
  }

  // Calculate return on investment
  calculateROI(
    totalCosts: number,
    salePrice: number
  ): number {
    return ((salePrice - totalCosts) / totalCosts) * 100
  }
}

export const financialCalculator = new FinancialCalculator()
