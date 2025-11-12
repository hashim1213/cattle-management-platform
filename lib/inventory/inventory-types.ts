// Unified Inventory System - Core Types
// Combines drugs, feed, and supplements into a single inventory module

export type InventoryCategory =
  // Drugs & Medications
  | "antibiotic"
  | "antiparasitic"
  | "vaccine"
  | "anti-inflammatory"
  | "hormone"
  | "vitamin-injectable"
  | "drug-other"
  // Feed Categories (from enhanced-feed-store.ts)
  | "corn-silage"
  | "haylage"
  | "hay-alfalfa"
  | "hay-grass"
  | "hay-mixed"
  | "straw"
  | "shell-corn"
  | "barley"
  | "oats"
  | "grain-mix"
  // Supplements
  | "protein-supplement"
  | "mineral-supplement"
  | "vitamin-supplement"
  | "distillers-grains"
  | "wheat-middlings"
  | "canola-meal"
  | "other"

export type InventoryUnit =
  | "cc"
  | "ml"
  | "lbs"
  | "kg"
  | "tons"
  | "bales"
  | "bags"
  | "bushels"
  | "doses"

export type TransactionType =
  | "purchase"      // Adding to inventory
  | "usage"         // Normal consumption (health/feed)
  | "adjustment"    // Manual correction
  | "waste"         // Expired/damaged
  | "return"        // Return to supplier
  | "transfer"      // Move between locations

/**
 * Core inventory item - represents any item tracked in inventory
 */
export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantityOnHand: number
  unit: InventoryUnit

  // Reorder management
  reorderPoint: number           // Alert when below this
  reorderQuantity: number        // How much to reorder
  lowStockAlertSent: boolean     // Track if alert was sent

  // Cost tracking
  costPerUnit: number
  totalValue: number             // quantityOnHand * costPerUnit

  // Drug-specific fields (optional)
  withdrawalPeriod?: number      // Days until safe for slaughter
  lotNumber?: string
  expirationDate?: string
  manufacturer?: string
  activeIngredient?: string
  concentration?: string         // e.g., "200mg/ml"

  // Feed-specific fields (optional)
  source?: "self-produced" | "purchased" | "other"
  harvestDate?: string
  moistureContent?: number
  quality?: "excellent" | "good" | "fair" | "poor"

  // Storage & supplier
  storageLocation: string
  supplier?: string
  purchaseDate?: string
  receiptImageUrl?: string       // For OCR integration

  // Metadata
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Transaction log - complete audit trail for all inventory changes
 */
export interface InventoryTransaction {
  id: string
  itemId: string
  itemName: string               // Denormalized for quick lookup

  // Transaction details
  type: TransactionType
  quantityBefore: number
  quantityChange: number         // Positive for additions, negative for subtractions
  quantityAfter: number
  unit: InventoryUnit

  // Cost impact
  costPerUnit: number
  costImpact: number             // quantityChange * costPerUnit

  // Related records
  relatedRecordType?: "health_record" | "feed_allocation" | "bulk_health_record"
  relatedRecordId?: string

  // Audit trail
  reason: string
  performedBy: string
  timestamp: string
  notes?: string
}

/**
 * Inventory alert - for low stock warnings
 */
export interface InventoryAlert {
  id: string
  itemId: string
  itemName: string
  alertType: "low_stock" | "expired" | "expiring_soon"
  severity: "warning" | "critical"
  message: string
  currentQuantity?: number
  reorderPoint?: number
  expirationDate?: string
  createdAt: string
  resolved: boolean
  resolvedAt?: string
}

/**
 * Inventory availability check result
 */
export interface AvailabilityCheck {
  available: boolean
  currentQuantity: number
  requiredQuantity: number
  shortfall?: number
  itemName: string
  unit: InventoryUnit
}

/**
 * Inventory status summary
 */
export interface InventoryStatus {
  totalItems: number
  totalValue: number
  lowStockCount: number
  expiredCount: number
  expiringSoonCount: number      // Within 30 days
  alerts: InventoryAlert[]
}

/**
 * Helper function to get category display label
 */
export function getInventoryCategoryLabel(category: InventoryCategory): string {
  const labels: Record<InventoryCategory, string> = {
    // Drugs
    "antibiotic": "Antibiotic",
    "antiparasitic": "Antiparasitic",
    "vaccine": "Vaccine",
    "anti-inflammatory": "Anti-Inflammatory",
    "hormone": "Hormone/Growth Promotant",
    "vitamin-injectable": "Vitamin (Injectable)",
    "drug-other": "Other Drug",
    // Feed
    "corn-silage": "Corn Silage",
    "haylage": "Haylage",
    "hay-alfalfa": "Alfalfa Hay",
    "hay-grass": "Grass Hay",
    "hay-mixed": "Mixed Hay",
    "straw": "Straw",
    "shell-corn": "Shell Corn",
    "barley": "Barley",
    "oats": "Oats",
    "grain-mix": "Grain Mix",
    // Supplements
    "protein-supplement": "Protein Supplement",
    "mineral-supplement": "Mineral Supplement",
    "vitamin-supplement": "Vitamin Supplement",
    "distillers-grains": "Distillers Grains (DDG)",
    "wheat-middlings": "Wheat Middlings",
    "canola-meal": "Canola Meal",
    "other": "Other"
  }
  return labels[category] || category
}

/**
 * Get category options for dropdowns
 */
export function getInventoryCategoryOptions(): Array<{ value: InventoryCategory; label: string; group: string }> {
  const drugCategories: InventoryCategory[] = [
    "antibiotic",
    "antiparasitic",
    "vaccine",
    "anti-inflammatory",
    "hormone",
    "vitamin-injectable",
    "drug-other"
  ]

  const feedCategories: InventoryCategory[] = [
    "corn-silage",
    "haylage",
    "hay-alfalfa",
    "hay-grass",
    "hay-mixed",
    "straw",
    "shell-corn",
    "barley",
    "oats",
    "grain-mix"
  ]

  const supplementCategories: InventoryCategory[] = [
    "protein-supplement",
    "mineral-supplement",
    "vitamin-supplement",
    "distillers-grains",
    "wheat-middlings",
    "canola-meal",
    "other"
  ]

  return [
    ...drugCategories.map(cat => ({ value: cat, label: getInventoryCategoryLabel(cat), group: "Drugs & Medications" })),
    ...feedCategories.map(cat => ({ value: cat, label: getInventoryCategoryLabel(cat), group: "Feed & Forage" })),
    ...supplementCategories.map(cat => ({ value: cat, label: getInventoryCategoryLabel(cat), group: "Supplements" }))
  ]
}

/**
 * Check if category is a drug
 */
export function isDrugCategory(category: InventoryCategory): boolean {
  return [
    "antibiotic",
    "antiparasitic",
    "vaccine",
    "anti-inflammatory",
    "hormone",
    "vitamin-injectable",
    "drug-other"
  ].includes(category)
}

/**
 * Check if category is feed
 */
export function isFeedCategory(category: InventoryCategory): boolean {
  return [
    "corn-silage",
    "haylage",
    "hay-alfalfa",
    "hay-grass",
    "hay-mixed",
    "straw",
    "shell-corn",
    "barley",
    "oats",
    "grain-mix"
  ].includes(category)
}

/**
 * Check if category is supplement
 */
export function isSupplementCategory(category: InventoryCategory): boolean {
  return [
    "protein-supplement",
    "mineral-supplement",
    "vitamin-supplement",
    "distillers-grains",
    "wheat-middlings",
    "canola-meal"
  ].includes(category)
}
