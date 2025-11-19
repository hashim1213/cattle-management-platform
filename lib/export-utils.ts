// Export utilities for generating CSV reports for cattle, financial, and pasture data

import { firebaseDataStore as dataStore } from "./data-store-firebase"
import { treatmentStore } from "./treatment-store"
import { enhancedFeedStore } from "./enhanced-feed-store"
import { costCalculator } from "./cost-calculator"
import { firebasePenStore as penStore } from "./pen-store-firebase"

// Convert array of objects to CSV
function arrayToCSV(data: any[], headers: string[]): string {
  const csvRows = []

  // Add header row
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) return ""
      const escaped = String(value).replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}

// Download CSV file
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.setAttribute("href", url)
  a.setAttribute("download", filename)
  a.click()
  window.URL.revokeObjectURL(url)
}

// Export cattle inventory
export function exportCattleInventory(status?: "Active" | "Sold" | "Deceased" | "Culled") {
  let cattle = dataStore.getCattle()

  if (status) {
    cattle = cattle.filter((c) => c.status === status)
  }

  const headers = [
    "tagNumber",
    "name",
    "rfidTag",
    "breed",
    "sex",
    "birthDate",
    "purchaseDate",
    "purchasePrice",
    "purchaseWeight",
    "currentWeight",
    "status",
    "stage",
    "healthStatus",
    "penId",
    "barnId",
    "lot",
    "pasture",
    "pregnancyStatus",
    "expectedCalvingDate",
    "lastVetVisit",
    "colorMarkings",
    "hornStatus",
    "notes",
  ]

  const csv = arrayToCSV(cattle, headers)
  const filename = `cattle-inventory-${status || "all"}-${new Date().toISOString().split("T")[0]}.csv`
  downloadCSV(csv, filename)
}

// Export financial summary
export function exportFinancialSummary(dateRange?: { start: string; end: string }) {
  const cattle = dataStore.getCattleSync().filter((c) => c.status === "Active")

  const financialData = cattle.map((c) => {
    const costs = costCalculator.calculateCattleCosts(c.id, dateRange)

    return {
      tagNumber: c.tagNumber,
      name: c.name || "",
      breed: c.breed,
      sex: c.sex,
      purchaseDate: c.purchaseDate || "",
      purchasePrice: costs?.purchasePrice || 0,
      purchaseWeight: costs?.purchaseWeight || 0,
      currentWeight: costs?.currentWeight || 0,
      daysOnFeed: costs?.daysOnFeed || 0,
      weightGain: costs?.totalWeightGain || 0,
      avgDailyGain: costs?.averageDailyGain.toFixed(2) || 0,
      feedCost: costs?.feedCost.toFixed(2) || 0,
      treatmentCost: costs?.treatmentCost.toFixed(2) || 0,
      healthCost: costs?.healthCost.toFixed(2) || 0,
      totalInvestment: costs?.totalCostBasis.toFixed(2) || 0,
      costPerPound: costs?.costPerPound.toFixed(2) || 0,
      costOfGain: costs?.costOfGain.toFixed(2) || 0,
      breakEvenLivePrice: costs?.breakEvenLivePrice.toFixed(2) || 0,
      breakEvenCarcassPrice: costs?.breakEvenCarcassPrice.toFixed(2) || 0,
      estimatedMarketValue: costs?.estimatedMarketValue.toFixed(2) || 0,
      estimatedProfit: costs?.estimatedProfit.toFixed(2) || 0,
      roi: costs?.returnOnInvestment.toFixed(2) || 0,
    }
  })

  const headers = [
    "tagNumber",
    "name",
    "breed",
    "sex",
    "purchaseDate",
    "purchasePrice",
    "purchaseWeight",
    "currentWeight",
    "daysOnFeed",
    "weightGain",
    "avgDailyGain",
    "feedCost",
    "treatmentCost",
    "healthCost",
    "totalInvestment",
    "costPerPound",
    "costOfGain",
    "breakEvenLivePrice",
    "breakEvenCarcassPrice",
    "estimatedMarketValue",
    "estimatedProfit",
    "roi",
  ]

  const csv = arrayToCSV(financialData, headers)
  const dateStr = dateRange ? `${dateRange.start}_to_${dateRange.end}` : new Date().toISOString().split("T")[0]
  const filename = `financial-summary-${dateStr}.csv`
  downloadCSV(csv, filename)
}

// Export treatment records
export function exportTreatmentRecords(dateRange?: { start: string; end: string }) {
  let treatments = treatmentStore.getTreatments()

  if (dateRange) {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    treatments = treatments.filter((t) => {
      const date = new Date(t.date)
      return date >= start && date <= end
    })
  }

  const treatmentData = treatments.map((t) => {
    const cattle = t.cattleId ? dataStore.getCattleById(t.cattleId) : null

    return {
      date: t.date,
      cattleTagNumber: cattle?.tagNumber || "Bulk Treatment",
      penId: t.penId || "",
      treatmentType: t.treatmentType,
      productName: t.productName,
      manufacturer: t.manufacturer || "",
      dosage: t.dosage,
      dosageUnit: t.dosageUnit,
      applicationMethod: t.applicationMethod,
      cost: t.cost.toFixed(2),
      costPerHead: t.costPerHead?.toFixed(2) || "",
      headCount: t.headCount || 1,
      reason: t.reason,
      administeredBy: t.administeredBy,
      withdrawalPeriodDays: t.withdrawalPeriodDays || 0,
      withdrawalDate: t.withdrawalDate || "",
      notes: t.notes || "",
    }
  })

  const headers = [
    "date",
    "cattleTagNumber",
    "penId",
    "treatmentType",
    "productName",
    "manufacturer",
    "dosage",
    "dosageUnit",
    "applicationMethod",
    "cost",
    "costPerHead",
    "headCount",
    "reason",
    "administeredBy",
    "withdrawalPeriodDays",
    "withdrawalDate",
    "notes",
  ]

  const csv = arrayToCSV(treatmentData, headers)
  const dateStr = dateRange ? `${dateRange.start}_to_${dateRange.end}` : new Date().toISOString().split("T")[0]
  const filename = `treatment-records-${dateStr}.csv`
  downloadCSV(csv, filename)
}

// Export feed usage and costs
export function exportFeedRecords(dateRange?: { start: string; end: string }) {
  let allocations = enhancedFeedStore.getAllocations()

  if (dateRange) {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    allocations = allocations.filter((a) => {
      const date = new Date(a.date)
      return date >= start && date <= end
    })
  }

  // Flatten feed items for CSV
  const feedData: any[] = []
  allocations.forEach((allocation) => {
    allocation.feedItems.forEach((item) => {
      feedData.push({
        date: allocation.date,
        penName: allocation.penName,
        barnName: allocation.barnName || "",
        feedName: item.feedName,
        quantity: item.quantity.toFixed(2),
        unit: item.unit,
        costPerUnit: item.costPerUnit.toFixed(2),
        totalCost: item.totalCost.toFixed(2),
        totalBatchWeight: allocation.totalBatchWeight.toFixed(2),
        headCount: allocation.headCount,
        costPerHead: allocation.costPerHead.toFixed(2),
        deliveredBy: allocation.deliveredBy,
        mixerScaleWeight: allocation.mixerScaleWeight?.toFixed(2) || "",
      })
    })
  })

  const headers = [
    "date",
    "penName",
    "barnName",
    "feedName",
    "quantity",
    "unit",
    "costPerUnit",
    "totalCost",
    "totalBatchWeight",
    "headCount",
    "costPerHead",
    "deliveredBy",
    "mixerScaleWeight",
  ]

  const csv = arrayToCSV(feedData, headers)
  const dateStr = dateRange ? `${dateRange.start}_to_${dateRange.end}` : new Date().toISOString().split("T")[0]
  const filename = `feed-records-${dateStr}.csv`
  downloadCSV(csv, filename)
}

// Export pen/barn summary
export function exportPenBarnSummary() {
  const pens = penStore.getPens()

  const penData = pens.map((pen) => {
    const barn = penStore.getBarn(pen.barnId)
    const costs = costCalculator.calculatePenCosts(pen.id)

    return {
      penName: pen.name,
      barnName: barn?.name || "",
      capacity: pen.capacity,
      currentCount: pen.currentCount,
      utilizationPercent: ((pen.currentCount / pen.capacity) * 100).toFixed(1),
      headCount: costs?.headCount || 0,
      totalInvestment: costs?.totalInvestment.toFixed(2) || 0,
      totalFeedCost: costs?.totalFeedCost.toFixed(2) || 0,
      totalTreatmentCost: costs?.totalTreatmentCost.toFixed(2) || 0,
      averageCostPerHead: costs?.averageCostPerHead.toFixed(2) || 0,
      averageWeightPerHead: costs?.averageWeightPerHead.toFixed(0) || 0,
      averageDaysOnFeed: costs?.averageDaysOnFeed.toFixed(0) || 0,
      averageDailyGain: costs?.averageDailyGain.toFixed(2) || 0,
      averageCostOfGain: costs?.averageCostOfGain.toFixed(2) || 0,
      averageBreakEvenPrice: costs?.averageBreakEvenLivePrice.toFixed(2) || 0,
      totalEstimatedValue: costs?.totalEstimatedValue.toFixed(2) || 0,
      totalEstimatedProfit: costs?.totalEstimatedProfit.toFixed(2) || 0,
      averageROI: costs?.averageROI.toFixed(2) || 0,
    }
  })

  const headers = [
    "penName",
    "barnName",
    "capacity",
    "currentCount",
    "utilizationPercent",
    "headCount",
    "totalInvestment",
    "totalFeedCost",
    "totalTreatmentCost",
    "averageCostPerHead",
    "averageWeightPerHead",
    "averageDaysOnFeed",
    "averageDailyGain",
    "averageCostOfGain",
    "averageBreakEvenPrice",
    "totalEstimatedValue",
    "totalEstimatedProfit",
    "averageROI",
  ]

  const csv = arrayToCSV(penData, headers)
  const filename = `pen-barn-summary-${new Date().toISOString().split("T")[0]}.csv`
  downloadCSV(csv, filename)
}

// Export pasture data
export function exportPastureData() {
  const pastures = dataStore.getPastures()

  const headers = [
    "name",
    "acres",
    "grassType",
    "condition",
    "currentCattleCount",
    "maxCapacity",
    "utilizationPercent",
    "lastRotationDate",
    "nextRotationDate",
    "soilTestDate",
    "fertilizedDate",
    "notes",
  ]

  const pastureData = pastures.map((p) => ({
    ...p,
    utilizationPercent: ((p.currentCattleCount / p.maxCapacity) * 100).toFixed(1),
  }))

  const csv = arrayToCSV(pastureData, headers)
  const filename = `pasture-data-${new Date().toISOString().split("T")[0]}.csv`
  downloadCSV(csv, filename)
}

// Export mortality records
export function exportMortalityRecords(dateRange?: { start: string; end: string }) {
  let records = treatmentStore.getMortalityRecords()

  if (dateRange) {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    records = records.filter((r) => {
      const date = new Date(r.dateOfDeath)
      return date >= start && date <= end
    })
  }

  const headers = [
    "dateOfDeath",
    "tagNumber",
    "breed",
    "sex",
    "age",
    "penId",
    "barnId",
    "causeOfDeath",
    "category",
    "veterinarianConsulted",
    "veterinarianName",
    "necropsy",
    "purchasePrice",
    "estimatedLoss",
    "reportedBy",
    "notes",
  ]

  const csv = arrayToCSV(records, headers)
  const dateStr = dateRange ? `${dateRange.start}_to_${dateRange.end}` : new Date().toISOString().split("T")[0]
  const filename = `mortality-records-${dateStr}.csv`
  downloadCSV(csv, filename)
}

// Export comprehensive operation report (all data)
export function exportComprehensiveReport(dateRange?: { start: string; end: string }) {
  // This would create a more comprehensive report with multiple sections
  // For simplicity, we'll export the financial summary which includes most key metrics
  exportFinancialSummary(dateRange)
}

// Backwards compatibility functions for existing pages
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ""
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}

export function generateCattleReport(cattle: any[]) {
  return cattle.map((c) => ({
    "Tag Number": c.tagNumber,
    Name: c.name || "",
    Breed: c.breed,
    Sex: c.sex,
    "Birth Date": c.birthDate,
    "Weight (lbs)": c.weight,
    Stage: c.stage,
    Status: c.status,
    "Health Status": c.healthStatus,
    Lot: c.lot,
    Pasture: c.pasture || "",
    "Current Value": c.currentValue || "",
    "Last Vet Visit": c.lastVetVisit || "",
  }))
}

export function generateFinancialReport(transactions: any[]) {
  const income = transactions.filter((t) => t.type === "Sale").reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions.filter((t) => t.type !== "Sale").reduce((sum, t) => sum + t.amount, 0)

  const netProfit = income - expenses

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netProfit,
    profitMargin: income > 0 ? (netProfit / income) * 100 : 0,
    transactions: transactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: t.category,
      Amount: t.amount,
      Description: t.description,
    })),
  }
}
