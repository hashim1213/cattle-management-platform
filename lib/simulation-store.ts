import { generateUniqueId } from "./id-generator"

export interface SimulationParameters {
  // Purchase Details
  headCount: number
  purchasePricePerHead: number
  averagePurchaseWeight: number // lbs

  // Feed Costs
  feedCostPerDay: number // per head
  feedDays: number // days on feed

  // Other Costs
  veterinaryCost: number // total
  laborCost: number // total
  transportCost: number // total
  otherCosts: number // total

  // Target Sale
  targetSaleWeight: number // lbs per head
  targetSalePricePerLb: number // $/lb
}

export interface SimulationResults {
  // Costs Breakdown
  totalPurchaseCost: number
  totalFeedCost: number
  totalVeterinaryCost: number
  totalLaborCost: number
  totalTransportCost: number
  totalOtherCosts: number
  totalCosts: number
  costPerHead: number

  // Revenue
  totalRevenue: number
  revenuePerHead: number

  // Profit & Loss
  grossProfit: number
  grossProfitPerHead: number
  profitMargin: number // percentage

  // Weight & Performance
  totalWeightGain: number
  weightGainPerHead: number
  costOfGain: number // $/lb

  // Break-Even Analysis
  breakEvenPricePerLb: number
  breakEvenPricePerHead: number
  requiredMarginForProfit: number // percentage above break-even
}

export interface Simulation {
  id: string
  name: string
  description?: string
  parameters: SimulationParameters
  results: SimulationResults
  supplier?: string
  feederLoanNumber?: string
  createdAt: string
  updatedAt: string
  executed: boolean // whether this has been converted to a real batch
  executedBatchId?: string
}

class SimulationStore {
  private simulations: Simulation[] = []
  private listeners: Array<() => void> = []

  constructor() {
    // Removed localStorage caching for realtime data loading
    this.simulations = []
  }

  private save() {
    // Removed localStorage caching for realtime data loading
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  calculateResults(params: SimulationParameters): SimulationResults {
    // Costs Breakdown
    const totalPurchaseCost = params.headCount * params.purchasePricePerHead
    const totalFeedCost = params.headCount * params.feedCostPerDay * params.feedDays
    const totalVeterinaryCost = params.veterinaryCost
    const totalLaborCost = params.laborCost
    const totalTransportCost = params.transportCost
    const totalOtherCosts = params.otherCosts

    const totalCosts =
      totalPurchaseCost +
      totalFeedCost +
      totalVeterinaryCost +
      totalLaborCost +
      totalTransportCost +
      totalOtherCosts

    const costPerHead = totalCosts / params.headCount

    // Revenue
    const totalRevenue = params.headCount * params.targetSaleWeight * params.targetSalePricePerLb
    const revenuePerHead = totalRevenue / params.headCount

    // Profit & Loss
    const grossProfit = totalRevenue - totalCosts
    const grossProfitPerHead = grossProfit / params.headCount
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Weight & Performance
    const totalWeightGain = params.headCount * (params.targetSaleWeight - params.averagePurchaseWeight)
    const weightGainPerHead = params.targetSaleWeight - params.averagePurchaseWeight
    const costOfGain = totalWeightGain > 0 ? totalFeedCost / totalWeightGain : 0

    // Break-Even Analysis
    const totalLiveWeight = params.headCount * params.targetSaleWeight
    const breakEvenPricePerLb = totalLiveWeight > 0 ? totalCosts / totalLiveWeight : 0
    const breakEvenPricePerHead = costPerHead / params.targetSaleWeight

    // Required margin to make 5% profit
    const targetProfit = totalCosts * 0.05
    const requiredRevenue = totalCosts + targetProfit
    const requiredMarginForProfit =
      totalRevenue > 0 ? ((requiredRevenue - totalRevenue) / totalRevenue) * 100 : 0

    return {
      totalPurchaseCost,
      totalFeedCost,
      totalVeterinaryCost,
      totalLaborCost,
      totalTransportCost,
      totalOtherCosts,
      totalCosts,
      costPerHead,
      totalRevenue,
      revenuePerHead,
      grossProfit,
      grossProfitPerHead,
      profitMargin,
      totalWeightGain,
      weightGainPerHead,
      costOfGain,
      breakEvenPricePerLb,
      breakEvenPricePerHead,
      requiredMarginForProfit,
    }
  }

  addSimulation(
    name: string,
    parameters: SimulationParameters,
    options?: {
      description?: string
      supplier?: string
      feederLoanNumber?: string
    }
  ): Simulation {
    const results = this.calculateResults(parameters)

    const simulation: Simulation = {
      id: generateUniqueId("simulation"),
      name,
      description: options?.description,
      parameters,
      results,
      supplier: options?.supplier,
      feederLoanNumber: options?.feederLoanNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executed: false,
    }

    this.simulations.unshift(simulation)
    this.save()
    return simulation
  }

  updateSimulation(id: string, name: string, parameters: SimulationParameters): boolean {
    const index = this.simulations.findIndex((s) => s.id === id)
    if (index === -1) return false

    const results = this.calculateResults(parameters)
    this.simulations[index] = {
      ...this.simulations[index],
      name,
      parameters,
      results,
      updatedAt: new Date().toISOString(),
    }

    this.save()
    return true
  }

  deleteSimulation(id: string): boolean {
    const index = this.simulations.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.simulations.splice(index, 1)
    this.save()
    return true
  }

  getSimulation(id: string): Simulation | undefined {
    return this.simulations.find((s) => s.id === id)
  }

  getSimulations(): Simulation[] {
    return [...this.simulations]
  }

  markAsExecuted(id: string, batchId: string): boolean {
    const index = this.simulations.findIndex((s) => s.id === id)
    if (index === -1) return false

    this.simulations[index].executed = true
    this.simulations[index].executedBatchId = batchId
    this.simulations[index].updatedAt = new Date().toISOString()

    this.save()
    return true
  }

  duplicateSimulation(id: string): Simulation | null {
    const original = this.getSimulation(id)
    if (!original) return null

    const simulation: Simulation = {
      ...original,
      id: generateUniqueId("simulation"),
      name: `${original.name} (Copy)`,
      executed: false,
      executedBatchId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.simulations.unshift(simulation)
    this.save()
    return simulation
  }
}

export const simulationStore = new SimulationStore()
