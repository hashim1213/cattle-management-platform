"use client"

import { useMemo } from "react"
import { costCalculator, type CattleCostBreakdown, type PenCostBreakdown } from "@/lib/cost-calculator"

export function useCostCalculator() {
  return useMemo(
    () => ({
      calculateCattleCosts: (cattleId: string, dateRange?: { start: string; end: string }) =>
        costCalculator.calculateCattleCosts(cattleId, dateRange),

      calculatePenCosts: (penId: string, dateRange?: { start: string; end: string }) =>
        costCalculator.calculatePenCosts(penId, dateRange),

      calculateOperationCosts: (dateRange?: { start: string; end: string }) =>
        costCalculator.calculateOperationCosts(dateRange),

      setMarketPrice: (pricePerPound: number) => costCalculator.setMarketPrice(pricePerPound),

      setDressingPercentage: (percentage: number) => costCalculator.setDressingPercentage(percentage),
    }),
    []
  )
}
