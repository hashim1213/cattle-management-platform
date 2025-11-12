// Treatment Protocol Templates for Bulk Operations

export interface TreatmentProtocolDrug {
  drugInventoryId: string
  drugName: string
  dosageAmount: number
  dosageUnit: "cc" | "ml"
  dosageType: "fixed" | "weight-based" // Fixed (5cc/head) or weight-based (1cc/100lbs)
  administrationRoute: "IM" | "SQ" | "IV" | "Oral" | "Intranasal"
  withdrawalPeriod: number
  notes?: string
}

export interface TreatmentProtocol {
  id: string
  name: string
  description: string
  category: "arrival" | "vaccination" | "deworming" | "processing" | "treatment" | "custom"
  drugs: TreatmentProtocolDrug[]
  estimatedCostPerHead: number
  isDefault: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// Pre-defined treatment protocols based on common Canadian cattle operations
export const DEFAULT_PROTOCOLS: TreatmentProtocol[] = [
  {
    id: "protocol-arrival-standard",
    name: "Standard Arrival Protocol",
    description: "Typical treatment for newly arrived feeder cattle",
    category: "arrival",
    drugs: [
      {
        drugInventoryId: "inv-drug-1",
        drugName: "Bovi-Shield Gold 5",
        dosageAmount: 5,
        dosageUnit: "cc",
        dosageType: "fixed",
        administrationRoute: "IM",
        withdrawalPeriod: 21,
        notes: "5-way respiratory vaccine"
      },
      {
        drugInventoryId: "inv-drug-2",
        drugName: "LA-200 (Oxytetracycline)",
        dosageAmount: 5,
        dosageUnit: "cc",
        dosageType: "fixed",
        administrationRoute: "IM",
        withdrawalPeriod: 28,
        notes: "Broad-spectrum antibiotic"
      },
      {
        drugInventoryId: "inv-drug-3",
        drugName: "Ivomec Plus",
        dosageAmount: 1,
        dosageUnit: "cc",
        dosageType: "weight-based", // 1cc per 110 lbs
        administrationRoute: "SQ",
        withdrawalPeriod: 49,
        notes: "Dewormer - 1cc per 110 lbs"
      }
    ],
    estimatedCostPerHead: 12.50,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "protocol-spring-vaccination",
    name: "Spring Vaccination",
    description: "Annual spring vaccination and deworming",
    category: "vaccination",
    drugs: [
      {
        drugInventoryId: "inv-drug-1",
        drugName: "Bovi-Shield Gold 5",
        dosageAmount: 5,
        dosageUnit: "cc",
        dosageType: "fixed",
        administrationRoute: "IM",
        withdrawalPeriod: 21,
        notes: "Annual booster"
      },
      {
        drugInventoryId: "inv-drug-3",
        drugName: "Ivomec Plus",
        dosageAmount: 1,
        dosageUnit: "cc",
        dosageType: "weight-based",
        administrationRoute: "SQ",
        withdrawalPeriod: 49,
        notes: "Spring deworming"
      }
    ],
    estimatedCostPerHead: 8.00,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "protocol-respiratory-treatment",
    name: "Respiratory Treatment",
    description: "Treatment for respiratory illness (BRD)",
    category: "treatment",
    drugs: [
      {
        drugInventoryId: "inv-drug-2",
        drugName: "LA-200 (Oxytetracycline)",
        dosageAmount: 10,
        dosageUnit: "cc",
        dosageType: "fixed",
        administrationRoute: "IM",
        withdrawalPeriod: 28,
        notes: "Higher dose for respiratory"
      }
    ],
    estimatedCostPerHead: 4.50,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "protocol-deworming-only",
    name: "Deworming Only",
    description: "Standalone deworming treatment",
    category: "deworming",
    drugs: [
      {
        drugInventoryId: "inv-drug-3",
        drugName: "Ivomec Plus",
        dosageAmount: 1,
        dosageUnit: "cc",
        dosageType: "weight-based",
        administrationRoute: "SQ",
        withdrawalPeriod: 49,
        notes: "1cc per 110 lbs body weight"
      }
    ],
    estimatedCostPerHead: 3.50,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

/**
 * Calculate dosage for weight-based drugs
 */
export function calculateWeightBasedDosage(
  drug: TreatmentProtocolDrug,
  animalWeight: number
): number {
  if (drug.dosageType === "fixed") {
    return drug.dosageAmount
  }

  // Weight-based dosage calculation
  // Ivomec: 1cc per 110 lbs
  // Generic: dosageAmount represents cc per 100 lbs
  const baseWeight = 110 // Default to 110 lbs per unit
  return (animalWeight / baseWeight) * drug.dosageAmount
}

/**
 * Calculate total drug requirements for a group of cattle
 */
export function calculateTotalDrugRequirements(
  protocol: TreatmentProtocol,
  cattle: Array<{ weight: number }>
): Record<string, { drugId: string; drugName: string; totalRequired: number; unit: string }> {
  const requirements: Record<
    string,
    { drugId: string; drugName: string; totalRequired: number; unit: string }
  > = {}

  cattle.forEach((animal) => {
    protocol.drugs.forEach((drug) => {
      const key = drug.drugInventoryId

      if (!requirements[key]) {
        requirements[key] = {
          drugId: drug.drugInventoryId,
          drugName: drug.drugName,
          totalRequired: 0,
          unit: drug.dosageUnit
        }
      }

      const dosage = calculateWeightBasedDosage(drug, animal.weight || 600)
      requirements[key].totalRequired += dosage
    })
  })

  return requirements
}

/**
 * Estimate total cost for protocol on group of cattle
 */
export function estimateProtocolCost(
  protocol: TreatmentProtocol,
  headCount: number
): number {
  return protocol.estimatedCostPerHead * headCount
}

/**
 * Get protocol by ID
 */
export function getProtocolById(protocolId: string): TreatmentProtocol | undefined {
  return DEFAULT_PROTOCOLS.find((p) => p.id === protocolId)
}

/**
 * Get protocols by category
 */
export function getProtocolsByCategory(
  category: TreatmentProtocol["category"]
): TreatmentProtocol[] {
  return DEFAULT_PROTOCOLS.filter((p) => p.category === category)
}

/**
 * Get all default protocols
 */
export function getAllProtocols(): TreatmentProtocol[] {
  return DEFAULT_PROTOCOLS
}
