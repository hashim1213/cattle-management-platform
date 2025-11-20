/**
 * AI Intelligence Layer - Farm Context Builder
 * Gathers comprehensive farm data to give AI full understanding of operations
 */

import { adminDb } from "@/lib/firebase-admin"


export interface FarmContext {
  cattle: {
    total: number
    byStatus: Record<string, number>
    byPen: Record<string, number>
    recentAdditions: any[]
    healthIssues: any[]
    avgWeight: number
  }
  pens: {
    total: number
    utilization: number
    available: number
    overcrowded: any[]
    empty: any[]
  }
  barns: {
    total: number
    list: any[]
  }
  inventory: {
    total: number
    lowStock: any[]
    totalValue: number
    recentUsage: any[]
  }
  health: {
    recentTreatments: any[]
    activeCases: number
    mostUsedMedications: any[]
  }
  activities: {
    recent: any[]
    byType: Record<string, number>
  }
  financials: {
    totalPurchaseValue: number
    inventoryValue: number
    avgCattlePrice: number
  }
  summary: string
}

export class FarmContextBuilder {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Build comprehensive farm context for AI
   */
  async buildContext(): Promise<FarmContext> {
    try {
      const [cattle, pens, barns, inventory, health, activities] = await Promise.all([
        this.getCattleContext(),
        this.getPensContext(),
        this.getBarnsContext(),
        this.getInventoryContext(),
        this.getHealthContext(),
        this.getActivitiesContext(),
      ])

      const financials = this.calculateFinancials(cattle.all, inventory.all)

      const summary = this.generateSummary({
        cattle,
        pens,
        barns,
        inventory,
        health,
        activities,
        financials,
      })

      return {
        cattle: {
          total: cattle.total,
          byStatus: cattle.byStatus,
          byPen: cattle.byPen,
          recentAdditions: cattle.recent,
          healthIssues: cattle.healthIssues,
          avgWeight: cattle.avgWeight,
        },
        pens: {
          total: pens.total,
          utilization: pens.utilization,
          available: pens.available,
          overcrowded: pens.overcrowded,
          empty: pens.empty,
        },
        barns: {
          total: barns.total,
          list: barns.list,
        },
        inventory: {
          total: inventory.total,
          lowStock: inventory.lowStock,
          totalValue: inventory.totalValue,
          recentUsage: inventory.recent,
        },
        health: {
          recentTreatments: health.recent,
          activeCases: health.activeCases,
          mostUsedMedications: health.mostUsed,
        },
        activities: {
          recent: activities.recent,
          byType: activities.byType,
        },
        financials,
        summary,
      }
    } catch (error) {
      console.error("Error building farm context:", error)
      throw error
    }
  }

  private async getCattleContext() {
    const cattleRef = adminDb.collection(`users/${this.userId}/cattle`)
    const snapshot = await cattleRef.get()

    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const total = all.length

    const byStatus: Record<string, number> = {}
    const byPen: Record<string, number> = {}
    let totalWeight = 0
    const healthIssues: any[] = []

    all.forEach((cattle: any) => {
      // Status
      const status = cattle.status || "Active"
      byStatus[status] = (byStatus[status] || 0) + 1

      // Pen distribution
      const penId = cattle.penId || "Unassigned"
      byPen[penId] = (byPen[penId] || 0) + 1

      // Weight
      if (cattle.weight) {
        totalWeight += cattle.weight
      }

      // Health issues
      if (cattle.healthStatus && cattle.healthStatus !== "Healthy") {
        healthIssues.push({
          tagNumber: cattle.tagNumber,
          status: cattle.healthStatus,
          breed: cattle.breed,
        })
      }
    })

    // Recent additions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recent = all
      .filter((c: any) => c.createdAt && new Date(c.createdAt) > sevenDaysAgo)
      .slice(0, 10)

    return {
      all,
      total,
      byStatus,
      byPen,
      avgWeight: total > 0 ? Math.round(totalWeight / total) : 0,
      healthIssues,
      recent,
    }
  }

  private async getPensContext() {
    const pensRef = adminDb.collection(`users/${this.userId}/pens`)
    const snapshot = await pensRef.get()

    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const total = all.length

    let totalCapacity = 0
    let totalUsed = 0
    const overcrowded: any[] = []
    const empty: any[] = []

    all.forEach((pen: any) => {
      const capacity = pen.capacity || 0
      const current = pen.currentCount || 0

      totalCapacity += capacity
      totalUsed += current

      if (current > capacity) {
        overcrowded.push({ name: pen.name, current, capacity, overage: current - capacity })
      }

      if (current === 0) {
        empty.push({ name: pen.name, capacity })
      }
    })

    const utilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0
    const available = totalCapacity - totalUsed

    return {
      total,
      utilization,
      available,
      overcrowded,
      empty,
    }
  }

  private async getBarnsContext() {
    const barnsRef = adminDb.collection(`users/${this.userId}/barns`)
    const snapshot = await barnsRef.get()

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      location: doc.data().location,
    }))

    return {
      total: list.length,
      list,
    }
  }

  private async getInventoryContext() {
    const inventoryRef = adminDb.collection(`users/${this.userId}/inventory`)
    const snapshot = await inventoryRef.get()

    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const total = all.length

    let totalValue = 0
    const lowStock: any[] = []

    all.forEach((item: any) => {
      const value = (item.quantityOnHand || 0) * (item.costPerUnit || 0)
      totalValue += value

      if (item.reorderPoint && item.quantityOnHand <= item.reorderPoint) {
        lowStock.push({
          name: item.name,
          quantity: item.quantityOnHand,
          unit: item.unit,
          reorderPoint: item.reorderPoint,
        })
      }
    })

    // Recent transactions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const transRef = adminDb.collection(`users/${this.userId}/inventoryTransactions`)
    const transQuery = transRef.orderBy("timestamp", "desc").limit(20)
    const transSnapshot = await transQuery.get()
    const recent = transSnapshot.docs.map(doc => doc.data())

    return {
      all,
      total,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStock,
      recent,
    }
  }

  private async getHealthContext() {
    const healthRef = adminDb.collection(`users/${this.userId}/cattle`)
    const snapshot = await healthRef.get()

    const recent: any[] = []
    const activeCases: number = 0
    const medicationUsage: Record<string, number> = {}

    // Get health records from each cattle's subcollection
    for (const cattleDoc of snapshot.docs.slice(0, 50)) {
      try {
        const healthRecordsRef = adminDb.collection(`users/${this.userId}/cattle/${cattleDoc.id}/healthRecords`)
        const healthQuery = healthRecordsRef.orderBy("date", "desc").limit(5)
        const healthSnapshot = await healthQuery.get()

        healthSnapshot.docs.forEach(doc => {
          const record = doc.data()
          recent.push({
            cattleTag: cattleDoc.data().tagNumber,
            medication: record.medicationName,
            date: record.date,
            notes: record.notes,
          })

          if (record.medicationName) {
            medicationUsage[record.medicationName] = (medicationUsage[record.medicationName] || 0) + 1
          }
        })
      } catch (error) {
        // Continue if health records don't exist
      }
    }

    const mostUsed = Object.entries(medicationUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      recent: recent.slice(0, 10),
      activeCases,
      mostUsed,
    }
  }

  private async getActivitiesContext() {
    const activitiesRef = adminDb.collection(`users/${this.userId}/penActivities`)
    const q = activitiesRef.orderBy("date", "desc"), limit(20))
    const snapshot = await q.get()

    const recent = snapshot.docs.map(doc => doc.data())
    const byType: Record<string, number> = {}

    recent.forEach((activity: any) => {
      const type = activity.activityType || "Other"
      byType[type] = (byType[type] || 0) + 1
    })

    return {
      recent,
      byType,
    }
  }

  private calculateFinancials(cattle: any[], inventory: any[]) {
    let totalPurchaseValue = 0
    let cattleWithPrice = 0

    cattle.forEach((c: any) => {
      if (c.purchasePrice) {
        totalPurchaseValue += c.purchasePrice
        cattleWithPrice++
      }
    })

    const inventoryValue = inventory.reduce((sum, item) => {
      return sum + ((item.quantityOnHand || 0) * (item.costPerUnit || 0))
    }, 0)

    return {
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      avgCattlePrice: cattleWithPrice > 0 ? Math.round((totalPurchaseValue / cattleWithPrice) * 100) / 100 : 0,
    }
  }

  private generateSummary(data: any): string {
    const parts = []

    parts.push(`You manage a farm with ${data.cattle.total} cattle across ${data.pens.total} pens.`)

    if (data.pens.utilization > 0) {
      parts.push(`Pens are ${data.pens.utilization}% full.`)
    }

    if (data.cattle.healthIssues.length > 0) {
      parts.push(`There are ${data.cattle.healthIssues.length} cattle with health issues.`)
    }

    if (data.inventory.lowStock.length > 0) {
      parts.push(`${data.inventory.lowStock.length} inventory items are low on stock.`)
    }

    if (data.cattle.recent.length > 0) {
      parts.push(`${data.cattle.recent.length} cattle were added in the last 7 days.`)
    }

    return parts.join(" ")
  }
}
