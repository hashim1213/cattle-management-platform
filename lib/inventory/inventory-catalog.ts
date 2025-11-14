/**
 * Inventory Catalog - Database of common medications, feeds, and supplements
 * This allows users to search and select items with pre-filled data
 * Catalog can be expanded as more medication data is gathered
 */

import { InventoryCategory, InventoryUnit } from "./inventory-types"

export interface CatalogItem {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  description?: string
  // Pre-filled defaults
  defaultReorderPoint?: number
  defaultReorderQty?: number
  defaultCost?: number
  // Drug-specific defaults
  withdrawalPeriod?: number
  concentration?: string
  activeIngredient?: string
  // Feed-specific defaults
  protein?: number // % DM basis
  energy?: number // Mcal/lb (TDN)
  // Search/filter helpers
  commonNames?: string[] // Alternative names for searching
  manufacturer?: string
}

/**
 * Medication Catalog
 * Add more medications as data is gathered
 */
export const MEDICATION_CATALOG: CatalogItem[] = [
  // Antibiotics
  {
    name: "Penicillin (Procaine)",
    category: "antibiotic",
    unit: "ml",
    description: "Procaine penicillin G for bacterial infections",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 0.15,
    withdrawalPeriod: 10,
    concentration: "300,000 IU/ml",
    activeIngredient: "Procaine Penicillin G",
    commonNames: ["Penicillin", "Pen G"]
  },
  {
    name: "LA-200 (Oxytetracycline)",
    category: "antibiotic",
    unit: "ml",
    description: "Long-acting oxytetracycline",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 0.30,
    withdrawalPeriod: 28,
    concentration: "200 mg/ml",
    activeIngredient: "Oxytetracycline",
    commonNames: ["LA-200", "Oxy", "Liquamycin"]
  },
  {
    name: "Excenel RTU",
    category: "antibiotic",
    unit: "ml",
    description: "Ceftiofur crystalline free acid",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 1.50,
    withdrawalPeriod: 13,
    concentration: "200 mg/ml",
    activeIngredient: "Ceftiofur",
    commonNames: ["Excenel", "Ceftiofur"]
  },
  {
    name: "Draxxin",
    category: "antibiotic",
    unit: "ml",
    description: "Tulathromycin for respiratory disease",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 2.00,
    withdrawalPeriod: 18,
    concentration: "100 mg/ml",
    activeIngredient: "Tulathromycin",
    commonNames: ["Draxxin", "Tulathromycin"]
  },

  // Anti-inflammatories
  {
    name: "Banamine (Flunixin)",
    category: "anti-inflammatory",
    unit: "ml",
    description: "Flunixin meglumine for pain and fever",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 0.50,
    withdrawalPeriod: 4,
    concentration: "50 mg/ml",
    activeIngredient: "Flunixin Meglumine",
    commonNames: ["Banamine", "Flunixin"]
  },
  {
    name: "Dexamethasone",
    category: "anti-inflammatory",
    unit: "ml",
    description: "Corticosteroid anti-inflammatory",
    defaultReorderPoint: 20,
    defaultReorderQty: 100,
    defaultCost: 0.25,
    withdrawalPeriod: 7,
    concentration: "2 mg/ml",
    activeIngredient: "Dexamethasone",
    commonNames: ["Dex", "Dexamethasone"]
  },

  // Antiparasitics
  {
    name: "Ivomec (Ivermectin)",
    category: "antiparasitic",
    unit: "ml",
    description: "Ivermectin pour-on for parasites",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 0.40,
    withdrawalPeriod: 48,
    concentration: "5 mg/ml",
    activeIngredient: "Ivermectin",
    commonNames: ["Ivomec", "Ivermectin"]
  },
  {
    name: "Cydectin Pour-On",
    category: "antiparasitic",
    unit: "ml",
    description: "Moxidectin for internal and external parasites",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 0.50,
    withdrawalPeriod: 14,
    concentration: "0.5%",
    activeIngredient: "Moxidectin",
    commonNames: ["Cydectin", "Moxidectin"]
  },
  {
    name: "SafeGuard (Fenbendazole)",
    category: "antiparasitic",
    unit: "ml",
    description: "Fenbendazole oral drench for worms",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 0.30,
    withdrawalPeriod: 8,
    concentration: "10%",
    activeIngredient: "Fenbendazole",
    commonNames: ["SafeGuard", "Panacur", "Fenbendazole"]
  },

  // Vaccines
  {
    name: "Bovi-Shield Gold 5",
    category: "vaccine",
    unit: "doses",
    description: "Modified-live virus vaccine for respiratory disease",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 2.50,
    withdrawalPeriod: 21,
    commonNames: ["Bovi-Shield", "IBR Vaccine"]
  },
  {
    name: "Vision 7 with SPUR",
    category: "vaccine",
    unit: "doses",
    description: "Clostridial vaccine",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 2.00,
    withdrawalPeriod: 21,
    commonNames: ["Vision 7", "Clostridial"]
  },

  // Vitamins
  {
    name: "Vitamin B Complex",
    category: "vitamin-injectable",
    unit: "ml",
    description: "B-complex vitamin injection",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 0.20,
    withdrawalPeriod: 0,
    commonNames: ["B Complex", "Vitamin B"]
  },
  {
    name: "Vitamin AD&E",
    category: "vitamin-injectable",
    unit: "ml",
    description: "Fat-soluble vitamin injection",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 0.30,
    withdrawalPeriod: 0,
    commonNames: ["ADE", "Vitamin ADE"]
  },
]

/**
 * Feed Catalog
 */
export const FEED_CATALOG: CatalogItem[] = [
  // Silage
  {
    name: "Corn Silage",
    category: "corn-silage",
    unit: "tons",
    description: "Fermented whole corn plant",
    defaultReorderPoint: 10,
    defaultReorderQty: 50,
    defaultCost: 45,
    protein: 8,
    energy: 0.70,
    commonNames: ["Corn Silage", "Silage"]
  },
  {
    name: "Haylage",
    category: "haylage",
    unit: "tons",
    description: "Fermented hay",
    defaultReorderPoint: 10,
    defaultReorderQty: 50,
    defaultCost: 50,
    protein: 12,
    energy: 0.60,
    commonNames: ["Haylage", "Baleage"]
  },

  // Hay
  {
    name: "Alfalfa Hay",
    category: "hay-alfalfa",
    unit: "bales",
    description: "High-protein legume hay",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 8,
    protein: 18,
    energy: 0.55,
    commonNames: ["Alfalfa", "Legume Hay"]
  },
  {
    name: "Grass Hay",
    category: "hay-grass",
    unit: "bales",
    description: "Mixed grass hay",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 5,
    protein: 10,
    energy: 0.50,
    commonNames: ["Grass Hay", "Timothy", "Brome"]
  },
  {
    name: "Mixed Hay (Grass/Alfalfa)",
    category: "hay-mixed",
    unit: "bales",
    description: "Grass and alfalfa mix",
    defaultReorderPoint: 100,
    defaultReorderQty: 500,
    defaultCost: 6.50,
    protein: 14,
    energy: 0.52,
    commonNames: ["Mixed Hay", "Grass/Alfalfa"]
  },
  {
    name: "Straw",
    category: "straw",
    unit: "bales",
    description: "Wheat or oat straw for bedding/roughage",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 3,
    protein: 4,
    energy: 0.40,
    commonNames: ["Straw", "Bedding"]
  },

  // Grains
  {
    name: "Shell Corn",
    category: "shell-corn",
    unit: "bushels",
    description: "Whole kernel corn",
    defaultReorderPoint: 1000,
    defaultReorderQty: 5000,
    defaultCost: 4.50,
    protein: 9,
    energy: 0.90,
    commonNames: ["Corn", "Shell Corn", "Shelled Corn"]
  },
  {
    name: "Barley",
    category: "barley",
    unit: "bushels",
    description: "Barley grain",
    defaultReorderPoint: 500,
    defaultReorderQty: 2000,
    defaultCost: 5.00,
    protein: 12,
    energy: 0.85,
    commonNames: ["Barley"]
  },
  {
    name: "Oats",
    category: "oats",
    unit: "bushels",
    description: "Oat grain",
    defaultReorderPoint: 500,
    defaultReorderQty: 2000,
    defaultCost: 4.00,
    protein: 11,
    energy: 0.75,
    commonNames: ["Oats"]
  },
  {
    name: "Grain Mix",
    category: "grain-mix",
    unit: "lbs",
    description: "Commercial grain blend",
    defaultReorderPoint: 1000,
    defaultReorderQty: 5000,
    defaultCost: 0.25,
    protein: 14,
    energy: 0.80,
    commonNames: ["Grain Mix", "Commercial Feed"]
  },
]

/**
 * Supplement Catalog
 */
export const SUPPLEMENT_CATALOG: CatalogItem[] = [
  {
    name: "Protein Tub (32%)",
    category: "protein-supplement",
    unit: "lbs",
    description: "32% protein supplement tub",
    defaultReorderPoint: 200,
    defaultReorderQty: 1000,
    defaultCost: 0.50,
    protein: 32,
    energy: 0.75,
    commonNames: ["Protein Tub", "Lick Tub"]
  },
  {
    name: "Mineral Mix",
    category: "mineral-supplement",
    unit: "lbs",
    description: "Complete mineral supplement",
    defaultReorderPoint: 200,
    defaultReorderQty: 1000,
    defaultCost: 0.40,
    protein: 0,
    energy: 0,
    commonNames: ["Mineral", "Mineral Mix", "Trace Mineral"]
  },
  {
    name: "Vitamin Premix",
    category: "vitamin-supplement",
    unit: "lbs",
    description: "Vitamin supplement premix",
    defaultReorderPoint: 50,
    defaultReorderQty: 200,
    defaultCost: 1.00,
    protein: 0,
    energy: 0,
    commonNames: ["Vitamin Premix", "Vitamins"]
  },
  {
    name: "Distillers Grains (DDG)",
    category: "distillers-grains",
    unit: "lbs",
    description: "Dried distillers grains with solubles",
    defaultReorderPoint: 1000,
    defaultReorderQty: 5000,
    defaultCost: 0.12,
    protein: 28,
    energy: 0.88,
    commonNames: ["DDG", "DDGS", "Distillers"]
  },
  {
    name: "Wheat Middlings",
    category: "wheat-middlings",
    unit: "lbs",
    description: "Wheat mill byproduct",
    defaultReorderPoint: 1000,
    defaultReorderQty: 5000,
    defaultCost: 0.10,
    protein: 16,
    energy: 0.72,
    commonNames: ["Wheat Midds", "Middlings"]
  },
  {
    name: "Canola Meal",
    category: "canola-meal",
    unit: "lbs",
    description: "Canola seed meal protein supplement",
    defaultReorderPoint: 500,
    defaultReorderQty: 2000,
    defaultCost: 0.15,
    protein: 36,
    energy: 0.68,
    commonNames: ["Canola Meal", "Rapeseed Meal"]
  },
]

/**
 * Combined catalog for searching
 */
export const FULL_CATALOG: CatalogItem[] = [
  ...MEDICATION_CATALOG,
  ...FEED_CATALOG,
  ...SUPPLEMENT_CATALOG,
]

/**
 * Search catalog by name, common names, or description
 */
export function searchCatalog(query: string, category?: "meds" | "feed" | "supplements" | "all"): CatalogItem[] {
  const lowerQuery = query.toLowerCase().trim()

  if (!lowerQuery) {
    // No query - return filtered by category
    if (category === "meds") return MEDICATION_CATALOG
    if (category === "feed") return FEED_CATALOG
    if (category === "supplements") return SUPPLEMENT_CATALOG
    return FULL_CATALOG
  }

  let catalog = FULL_CATALOG
  if (category === "meds") catalog = MEDICATION_CATALOG
  if (category === "feed") catalog = FEED_CATALOG
  if (category === "supplements") catalog = SUPPLEMENT_CATALOG

  return catalog.filter(item => {
    // Search in name
    if (item.name.toLowerCase().includes(lowerQuery)) return true

    // Search in description
    if (item.description?.toLowerCase().includes(lowerQuery)) return true

    // Search in common names
    if (item.commonNames?.some(name => name.toLowerCase().includes(lowerQuery))) return true

    // Search in active ingredient
    if (item.activeIngredient?.toLowerCase().includes(lowerQuery)) return true

    return false
  })
}

/**
 * Get catalog items by category
 */
export function getCatalogByType(type: "meds" | "feed" | "supplements"): CatalogItem[] {
  if (type === "meds") return MEDICATION_CATALOG
  if (type === "feed") return FEED_CATALOG
  if (type === "supplements") return SUPPLEMENT_CATALOG
  return []
}
