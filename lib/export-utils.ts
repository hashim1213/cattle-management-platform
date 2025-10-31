import type { Cattle, Transaction } from "./data-store"

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

export function generateCattleReport(cattle: Cattle[]) {
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

export function generateFinancialReport(transactions: Transaction[]) {
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
